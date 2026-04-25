import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCcw, Download, ShieldCheck, ShieldAlert } from "lucide-react";
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

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: RLSResult[]) {
  const header = ["flow", "actor", "expected", "actual", "pass", "policy", "error"];
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    header.join(","),
    ...rows.map((r) => header.map((h) => esc((r as any)[h])).join(",")),
  ].join("\n");
}

export default function RLSReportsPage() {
  const [runs, setRuns] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "fail" | "pass">("all");

  const loadRuns = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const folders = (data ?? [])
      .filter((e) => !e.name.endsWith(".json") && !e.name.endsWith(".csv"))
      .map((e) => e.name)
      .sort()
      .reverse();
    setRuns(folders);
    const initial = folders[0] ?? null;
    setSelected(initial);
    if (initial) await loadReport(initial);
    else setLoading(false);
  };

  const loadReport = async (folder: string) => {
    setLoading(true);
    setReport(null);
    try {
      const url = publicUrl(`${PREFIX}/${folder}/report.json`) + `?t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Report;
      setReport(data);
    } catch (e: any) {
      toast.error(`Failed to load report: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const visibleResults = useMemo(() => {
    if (!report) return [];
    if (filter === "fail") return report.results.filter((r) => !r.pass);
    if (filter === "pass") return report.results.filter((r) => r.pass);
    return report.results;
  }, [report, filter]);

  const downloadJSON = () => {
    if (!report) return;
    downloadBlob(
      `rls-report-${report.run_id}.json`,
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
  };
  const downloadCSV = () => {
    if (!report) return;
    downloadBlob(
      `rls-report-${report.run_id}.csv`,
      new Blob([toCsv(report.results)], { type: "text/csv" }),
    );
  };

  return (
    <AdminLayout title="RLS Test Reports">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg">RLS Harness Results</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest pass/fail outcomes for ID download, application approval, and insert flows.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={selected ?? undefined}
                onValueChange={(v) => {
                  setSelected(v);
                  loadReport(v);
                }}
                disabled={!runs.length}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select a run…" />
                </SelectTrigger>
                <SelectContent>
                  {runs.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadRuns} className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={downloadJSON} disabled={!report} className="gap-2">
                <Download className="h-4 w-4" /> JSON
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCSV} disabled={!report} className="gap-2">
                <Download className="h-4 w-4" /> CSV
              </Button>
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
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Stat label="Run" value={report.run_id} mono />
                  <Stat label="When" value={new Date(report.generated_at).toLocaleString()} />
                  <Stat
                    label="Passed"
                    value={`${report.passed} / ${report.total}`}
                    icon={<ShieldCheck className="h-4 w-4 text-green-600" />}
                  />
                  <Stat
                    label="Failed"
                    value={`${report.failed}`}
                    icon={<ShieldAlert className={`h-4 w-4 ${report.failed ? "text-destructive" : "text-muted-foreground"}`} />}
                    accent={report.failed > 0 ? "destructive" : undefined}
                  />
                </div>

                <div className="flex gap-2 mb-3">
                  {(["all", "fail", "pass"] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filter === f ? "default" : "outline"}
                      onClick={() => setFilter(f)}
                    >
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
                      {visibleResults.map((r, i) => (
                        <TableRow key={i} className={!r.pass ? "bg-destructive/5" : undefined}>
                          <TableCell>
                            <Badge variant={r.pass ? "secondary" : "destructive"}>
                              {r.pass ? "PASS" : "FAIL"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{r.flow}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {r.actor}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs uppercase text-muted-foreground">{r.expected}</TableCell>
                          <TableCell className="text-xs uppercase">{r.actual}</TableCell>
                          <TableCell className="text-xs">{r.policy}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate" title={r.error}>
                            {r.error ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {visibleResults.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                            No rows for this filter.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Stat({
  label,
  value,
  mono,
  icon,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
  accent?: "destructive";
}) {
  return (
    <div className={`rounded-lg border p-3 ${accent === "destructive" ? "border-destructive/40 bg-destructive/5" : ""}`}>
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`mt-1 text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
