import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, RefreshCcw, Download, ShieldCheck, ShieldAlert,
  ArrowDownCircle, ArrowUpCircle, MinusCircle, PlusCircle, CircleDot, Mail,
} from "lucide-react";
import { toast } from "sonner";

type RLSResult = {
  flow: string;
  actor: "anon" | "user" | "admin";
  expected: "allow" | "deny";
  actual: "allow" | "deny";
  pass: boolean;
  policy: string;
  error?: string;
};
type Report = {
  run_id: string;
  generated_at: string;
  total: number;
  passed: number;
  failed: number;
  results: RLSResult[];
};

const BUCKET = "documents";
const PREFIX = "rls-reports";

const keyOf = (r: RLSResult) => `${r.flow}|${r.actor}|${r.expected}`;

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
function toCsv(rows: RLSResult[]) {
  const header = ["flow", "actor", "expected", "actual", "pass", "policy", "error"];
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header.join(","), ...rows.map((r) => header.map((h) => esc((r as any)[h])).join(","))].join("\n");
}

type DiffStatus = "regression" | "fixed" | "still-failing" | "added" | "removed" | "unchanged";
type DiffRow = {
  key: string;
  status: DiffStatus;
  flow: string;
  actor: RLSResult["actor"];
  expected: RLSResult["expected"];
  base?: RLSResult;
  head?: RLSResult;
};

function diffReports(base: Report, head: Report): DiffRow[] {
  const baseMap = new Map(base.results.map((r) => [keyOf(r), r]));
  const headMap = new Map(head.results.map((r) => [keyOf(r), r]));
  const keys = new Set<string>([...baseMap.keys(), ...headMap.keys()]);
  const rows: DiffRow[] = [];
  for (const k of keys) {
    const b = baseMap.get(k);
    const h = headMap.get(k);
    const ref = h ?? b!;
    let status: DiffStatus;
    if (b && !h) status = "removed";
    else if (!b && h) status = "added";
    else if (b!.pass && !h!.pass) status = "regression";
    else if (!b!.pass && h!.pass) status = "fixed";
    else if (!b!.pass && !h!.pass) status = "still-failing";
    else status = "unchanged";
    rows.push({ key: k, status, flow: ref.flow, actor: ref.actor, expected: ref.expected, base: b, head: h });
  }
  const order: DiffStatus[] = ["regression", "still-failing", "fixed", "added", "removed", "unchanged"];
  return rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.flow.localeCompare(b.flow));
}

const statusMeta: Record<DiffStatus, { label: string; className: string; icon: React.ReactNode; rowClass: string }> = {
  regression:     { label: "Regression",     className: "bg-destructive text-destructive-foreground", icon: <ArrowDownCircle className="h-3.5 w-3.5" />, rowClass: "bg-destructive/10" },
  "still-failing":{ label: "Still failing",  className: "border-destructive/40 text-destructive bg-destructive/5", icon: <ShieldAlert className="h-3.5 w-3.5" />, rowClass: "bg-destructive/5" },
  fixed:          { label: "Fixed",          className: "bg-green-600 text-white", icon: <ArrowUpCircle className="h-3.5 w-3.5" />, rowClass: "bg-green-500/10" },
  added:          { label: "Added",          className: "bg-blue-600 text-white", icon: <PlusCircle className="h-3.5 w-3.5" />, rowClass: "bg-blue-500/5" },
  removed:        { label: "Removed",        className: "bg-muted text-muted-foreground", icon: <MinusCircle className="h-3.5 w-3.5" />, rowClass: "bg-muted/40" },
  unchanged:      { label: "Unchanged",      className: "border text-muted-foreground", icon: <CircleDot className="h-3.5 w-3.5" />, rowClass: "" },
};

export default function RLSReportsPage() {
  const [runs, setRuns] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "fail" | "pass">("all");

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [baseRun, setBaseRun] = useState<string | null>(null);
  const [baseReport, setBaseReport] = useState<Report | null>(null);
  const [baseLoading, setBaseLoading] = useState(false);
  const [diffFilter, setDiffFilter] = useState<"changed" | "all">("changed");

  const fetchReport = async (folder: string): Promise<Report> => {
    const url = publicUrl(`${PREFIX}/${folder}/report.json`) + `?t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Report;
  };

  const loadRuns = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, {
      limit: 100, sortBy: { column: "name", order: "desc" },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const folders = (data ?? [])
      .filter((e) => !e.name.endsWith(".json") && !e.name.endsWith(".csv"))
      .map((e) => e.name).sort().reverse();
    setRuns(folders);
    const initial = folders[0] ?? null;
    setSelected(initial);
    setBaseRun(folders[1] ?? null);
    if (initial) {
      try { setReport(await fetchReport(initial)); }
      catch (e: any) { toast.error(`Failed to load report: ${e.message}`); }
    }
    setLoading(false);
  };

  const loadHead = async (folder: string) => {
    setLoading(true); setReport(null);
    try { setReport(await fetchReport(folder)); }
    catch (e: any) { toast.error(`Failed to load report: ${e.message}`); }
    finally { setLoading(false); }
  };
  const loadBase = async (folder: string) => {
    setBaseLoading(true); setBaseReport(null);
    try { setBaseReport(await fetchReport(folder)); }
    catch (e: any) { toast.error(`Failed to load base: ${e.message}`); }
    finally { setBaseLoading(false); }
  };

  useEffect(() => { loadRuns(); }, []);
  useEffect(() => {
    if (compareMode && baseRun && !baseReport) loadBase(baseRun);
  }, [compareMode, baseRun]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleResults = useMemo(() => {
    if (!report) return [];
    if (filter === "fail") return report.results.filter((r) => !r.pass);
    if (filter === "pass") return report.results.filter((r) => r.pass);
    return report.results;
  }, [report, filter]);

  const diff = useMemo(() => {
    if (!compareMode || !baseReport || !report) return null;
    return diffReports(baseReport, report);
  }, [compareMode, baseReport, report]);

  const diffSummary = useMemo(() => {
    if (!diff) return null;
    const s: Record<DiffStatus, number> = {
      regression: 0, fixed: 0, "still-failing": 0, added: 0, removed: 0, unchanged: 0,
    };
    diff.forEach((d) => s[d.status]++);
    return s;
  }, [diff]);

  const visibleDiff = useMemo(() => {
    if (!diff) return [];
    if (diffFilter === "all") return diff;
    return diff.filter((d) => d.status !== "unchanged");
  }, [diff, diffFilter]);

  const downloadJSON = () => report && downloadBlob(
    `rls-report-${report.run_id}.json`,
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const downloadCSV = () => report && downloadBlob(
    `rls-report-${report.run_id}.csv`,
    new Blob([toCsv(report.results)], { type: "text/csv" }),
  );
  const downloadDiffCsv = () => {
    if (!diff || !baseReport || !report) return;
    const header = ["status", "flow", "actor", "expected", "base_actual", "head_actual", "base_pass", "head_pass", "policy", "head_error", "base_error"];
    const esc = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = diff.map((d) => [
      d.status, d.flow, d.actor, d.expected,
      d.base?.actual ?? "", d.head?.actual ?? "",
      d.base?.pass ?? "", d.head?.pass ?? "",
      d.head?.policy ?? d.base?.policy ?? "",
      d.head?.error ?? "", d.base?.error ?? "",
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    downloadBlob(`rls-diff-${baseReport.run_id}-vs-${report.run_id}.csv`, new Blob([csv], { type: "text/csv" }));
  };

  return (
    <AdminLayout title="RLS Test Reports">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">RLS Harness Results</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pass/fail outcomes for ID download, application approval, and insert flows.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="compare-mode" checked={compareMode} onCheckedChange={setCompareMode} />
                <Label htmlFor="compare-mode" className="text-sm cursor-pointer">Compare runs</Label>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 flex-wrap">
              {compareMode && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Base</span>
                  <Select value={baseRun ?? undefined} onValueChange={(v) => { setBaseRun(v); loadBase(v); }} disabled={!runs.length}>
                    <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select base run…" /></SelectTrigger>
                    <SelectContent>
                      {runs.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-sm">→</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {compareMode && <span className="text-xs text-muted-foreground uppercase tracking-wide">Head</span>}
                <Select value={selected ?? undefined} onValueChange={(v) => { setSelected(v); loadHead(v); }} disabled={!runs.length}>
                  <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select a run…" /></SelectTrigger>
                  <SelectContent>
                    {runs.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={loadRuns} className="gap-2"><RefreshCcw className="h-4 w-4" /> Refresh</Button>
                {compareMode ? (
                  <Button variant="outline" size="sm" onClick={downloadDiffCsv} disabled={!diff} className="gap-2">
                    <Download className="h-4 w-4" /> Diff CSV
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={downloadJSON} disabled={!report} className="gap-2"><Download className="h-4 w-4" /> JSON</Button>
                    <Button variant="outline" size="sm" onClick={downloadCSV} disabled={!report} className="gap-2"><Download className="h-4 w-4" /> CSV</Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !report ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No reports found. Run <code className="font-mono">bun scripts/rls-harness.ts</code> to publish one.
              </div>
            ) : compareMode ? (
              <CompareView
                base={baseReport} head={report} loading={baseLoading}
                diff={diff} summary={diffSummary} visible={visibleDiff}
                diffFilter={diffFilter} setDiffFilter={setDiffFilter}
              />
            ) : (
              <SingleView report={report} visible={visibleResults} filter={filter} setFilter={setFilter} />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function SingleView({
  report, visible, filter, setFilter,
}: {
  report: Report; visible: RLSResult[];
  filter: "all" | "fail" | "pass";
  setFilter: (f: "all" | "fail" | "pass") => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Stat label="Run" value={report.run_id} mono />
        <Stat label="When" value={new Date(report.generated_at).toLocaleString()} />
        <Stat label="Passed" value={`${report.passed} / ${report.total}`} icon={<ShieldCheck className="h-4 w-4 text-green-600" />} />
        <Stat label="Failed" value={`${report.failed}`}
          icon={<ShieldAlert className={`h-4 w-4 ${report.failed ? "text-destructive" : "text-muted-foreground"}`} />}
          accent={report.failed > 0 ? "destructive" : undefined} />
      </div>

      <div className="flex gap-2 mb-3">
        {(["all", "fail", "pass"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "fail" ? "Failures" : "Passing"}
          </Button>
        ))}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Status</TableHead>
              <TableHead>Flow</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r, i) => (
              <TableRow key={i} className={!r.pass ? "bg-destructive/5" : undefined}>
                <TableCell><Badge variant={r.pass ? "secondary" : "destructive"}>{r.pass ? "PASS" : "FAIL"}</Badge></TableCell>
                <TableCell className="font-medium">{r.flow}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-xs">{r.actor}</Badge></TableCell>
                <TableCell className="text-xs uppercase text-muted-foreground">{r.expected}</TableCell>
                <TableCell className="text-xs uppercase">{r.actual}</TableCell>
                <TableCell className="text-xs">{r.policy}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate" title={r.error}>{r.error ?? "—"}</TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">No rows for this filter.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function CompareView({
  base, head, loading, diff, summary, visible, diffFilter, setDiffFilter,
}: {
  base: Report | null; head: Report; loading: boolean;
  diff: DiffRow[] | null; summary: Record<DiffStatus, number> | null;
  visible: DiffRow[]; diffFilter: "changed" | "all";
  setDiffFilter: (f: "changed" | "all") => void;
}) {
  if (loading || !base) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-sm">Pick a base run to compare against.</span>}
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <Stat label="Base run" value={base.run_id} mono />
        <Stat label="Head run" value={head.run_id} mono />
        <Stat label="Regressions" value={`${summary?.regression ?? 0}`}
          icon={<ArrowDownCircle className="h-4 w-4 text-destructive" />}
          accent={(summary?.regression ?? 0) > 0 ? "destructive" : undefined} />
        <Stat label="Fixed" value={`${summary?.fixed ?? 0}`} icon={<ArrowUpCircle className="h-4 w-4 text-green-600" />} />
        <Stat label="Still failing" value={`${summary?.["still-failing"] ?? 0}`} icon={<ShieldAlert className="h-4 w-4 text-destructive/70" />} />
        <Stat label="Added / Removed" value={`${summary?.added ?? 0} / ${summary?.removed ?? 0}`} icon={<PlusCircle className="h-4 w-4 text-blue-600" />} />
      </div>

      <div className="flex gap-2 mb-3">
        <Button size="sm" variant={diffFilter === "changed" ? "default" : "outline"} onClick={() => setDiffFilter("changed")}>Only changes</Button>
        <Button size="sm" variant={diffFilter === "all" ? "default" : "outline"} onClick={() => setDiffFilter("all")}>All flows</Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Change</TableHead>
              <TableHead>Flow</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Head</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Error (head)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((d) => {
              const meta = statusMeta[d.status];
              return (
                <TableRow key={d.key} className={meta.rowClass}>
                  <TableCell>
                    <Badge className={`gap-1 ${meta.className}`} variant="outline">
                      {meta.icon}{meta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{d.flow}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{d.actor}</Badge></TableCell>
                  <TableCell className="text-xs uppercase text-muted-foreground">{d.expected}</TableCell>
                  <TableCell><PassPill r={d.base} /></TableCell>
                  <TableCell><PassPill r={d.head} /></TableCell>
                  <TableCell className="text-xs">{d.head?.policy ?? d.base?.policy ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={d.head?.error ?? d.base?.error}>
                    {d.head?.error ?? d.base?.error ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                {diffFilter === "changed" ? "No changes between these two runs." : "No flows."}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PassPill({ r }: { r?: RLSResult }) {
  if (!r) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge variant={r.pass ? "secondary" : "destructive"} className="text-[10px]">
      {r.pass ? "PASS" : "FAIL"} · {r.actual}
    </Badge>
  );
}

function Stat({
  label, value, mono, icon, accent,
}: { label: string; value: string; mono?: boolean; icon?: React.ReactNode; accent?: "destructive" }) {
  return (
    <div className={`rounded-lg border p-3 ${accent === "destructive" ? "border-destructive/40 bg-destructive/5" : ""}`}>
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">{icon} {label}</div>
      <div className={`mt-1 text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
