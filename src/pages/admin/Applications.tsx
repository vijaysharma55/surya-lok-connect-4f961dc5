import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Eye, Check, X, Trash2, FileSpreadsheet, Loader2, AlertTriangle, ScanLine, ZoomIn } from "lucide-react";
import { maskAadhaar } from "@/lib/mask";

const AADHAAR_REJECT_REASONS = [
  "Aadhaar image is blurry / unreadable",
  "Aadhaar number does not match submitted value",
  "Name on Aadhaar does not match application",
  "Aadhaar image appears tampered or invalid",
  "Wrong document uploaded (not an Aadhaar)",
];

type Application = {
  id: string;
  application_code: string;
  full_name: string;
  mobile: string;
  aadhaar: string;
  email: string | null;
  district: string;
  block: string;
  panchayat: string;
  post: string;
  payment_amount: number;
  expected_amount: number;
  amount_paid: number;
  transaction_id: string;
  payment_screenshot_url: string;
  photo_url: string | null;
  aadhaar_image_url: string | null;
  status: string;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
};

type Role = { key: string; label: string };
type Loc = { id: string; name: string; type: string; parent_id: string | null };

const PIPELINE = ["pending", "verified", "active", "rejected"];
const PAGE_SIZE = 20;

const pipelineBadge = (s: string) => {
  if (s === "active" || s === "approved") return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
  if (s === "verified") return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
  if (s === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
  return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
};

const useDebounced = <T,>(v: T, ms = 350) => {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
};

export default function AdminApplications() {
  const { isAdmin, coordinatorDistricts } = useAuth();
  const [items, setItems] = useState<Application[]>([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [postFilter, setPostFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [aadhaarVerifying, setAadhaarVerifying] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const debouncedQ = useDebounced(q);

  useEffect(() => {
    supabase.from("roles_catalog").select("key,label").eq("active", true).order("sort_order")
      .then(({ data }) => setRoles((data as Role[]) ?? []));
    supabase.from("locations").select("id,name,type,parent_id").eq("type", "district").order("name")
      .then(({ data }) => setDistricts(((data as Loc[]) ?? []).map((d) => d.name)));
  }, []);

  useEffect(() => { setPage(0); }, [debouncedQ, statusFilter, postFilter, districtFilter]);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (postFilter !== "all") query = query.eq("post", postFilter);
    if (districtFilter !== "all") query = query.eq("district", districtFilter);
    if (!isAdmin && coordinatorDistricts.length > 0) {
      query = query.in("district", coordinatorDistricts);
    }
    if (debouncedQ.trim()) {
      const t = debouncedQ.trim();
      query = query.or(
        `mobile.ilike.%${t}%,aadhaar.ilike.%${t}%,full_name.ilike.%${t}%,application_code.ilike.%${t}%,transaction_id.ilike.%${t}%`,
      );
    }
    query = query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error, count: c } = await query;
    if (error) toast.error(error.message);
    setItems((data as Application[]) ?? []);
    setCount(c ?? 0);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [debouncedQ, statusFilter, postFilter, districtFilter, page, isAdmin, coordinatorDistricts.join("|")]);

  useEffect(() => {
    const channel = supabase
      .channel(`applications-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, []);

  const validate = (a: Application) => {
    const errs: string[] = [];
    if (!/^\d{10}$/.test(a.mobile.replace(/\D/g, ""))) errs.push("Mobile must be 10 digits");
    if (!/^\d{12}$/.test(a.aadhaar)) errs.push("Aadhaar must be 12 digits");
    if (a.amount_paid !== a.expected_amount) errs.push(`Amount mismatch ₹${a.amount_paid} vs ₹${a.expected_amount}`);
    return errs;
  };

  const updateStatus = async (id: string, status: string, admin_notes?: string | null) => {
    setBusyId(id);
    const patch: any = { status };
    if (admin_notes !== undefined) patch.admin_notes = admin_notes;
    if (status === "active") patch.approved_at = new Date().toISOString();
    if (status === "rejected") patch.approved_at = null;
    const { error } = await supabase.from("applications").update(patch).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Application ${status}`);
    if (status === "active") {
      supabase.functions
        .invoke("send-approval-email", { body: { applicationId: id } })
        .then(({ error: e }) => {
          if (e) toast.error(`Email not sent: ${e.message}`);
          else toast.success("Approval email sent");
        });
    }
    setViewing(null);
    setAadhaarVerifying(null);
    setRejectMode(false);
    setRejectReason("");
    setItems((p) => p.map((a) => (a.id === id ? { ...a, status, admin_notes: patch.admin_notes ?? a.admin_notes } : a)));
  };

  const bulkAction = async (status: "active" | "rejected") => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const patch: any = { status };
    if (status === "active") patch.approved_at = new Date().toISOString();
    const ids = Array.from(selected);
    const { error } = await supabase.from("applications").update(patch).in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${selected.size} record(s) ${status}`);
    if (status === "active") {
      Promise.all(
        ids.map((id) =>
          supabase.functions.invoke("send-approval-email", { body: { applicationId: id } }),
        ),
      ).then((results) => {
        const failed = results.filter((r) => r.error).length;
        if (failed) toast.error(`${failed} approval email(s) failed`);
      });
    }
    load();
  };

  const remove = async (id: string) => {
    if (!isAdmin) return toast.error("Only admins can delete");
    if (!confirm("Delete this application permanently?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((a) => a.id !== id));
    toast.success("Deleted");
  };

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const [memRes, appRes] = await Promise.all([
        supabase.from("memberships").select("*").order("created_at", { ascending: false }),
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
      ]);
      if (memRes.error) throw memRes.error;
      if (appRes.error) throw appRes.error;

      const memRows = (memRes.data ?? []).map((m: any) => ({
        Name: m.full_name, Phone: m.phone_number, Email: m.email ?? "", Aadhaar: m.aadhaar ?? "",
        Plan: m.membership_type, Status: m.status, Payment: m.payment_status,
        "Amount Paid": m.amount_paid ?? 0, "Expected": m.expected_amount ?? 0,
        Address: m.address ?? "", District: m.district ?? "",
        Created: new Date(m.created_at).toLocaleString(),
      }));
      const appRows = (appRes.data ?? []).map((a: any) => ({
        Code: a.application_code, Name: a.full_name, Mobile: a.mobile, Aadhaar: a.aadhaar,
        Email: a.email ?? "", Post: a.post, District: a.district, Block: a.block, Panchayat: a.panchayat,
        Status: a.status, "Amount Paid": a.amount_paid, Expected: a.expected_amount,
        "Txn ID": a.transaction_id, "Admin Notes": a.admin_notes ?? "",
        Created: new Date(a.created_at).toLocaleString(),
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memRows), "Members");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(appRows), "Volunteers & Coordinators");
      XLSX.writeFile(wb, `slkf-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Export complete");
    } catch (e: any) {
      toast.error(e.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  const toggleOne = (id: string) => {
    const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const posts = Array.from(new Set(roles.filter((r) => /coordinator|volunteer/i.test(r.key)).map((r) => r.label)));

  return (
    <AdminLayout title="Volunteers & Coordinators">
      {!isAdmin && coordinatorDistricts.length > 0 && (
        <div className="mb-3 text-xs rounded-md border border-blue-500/30 bg-blue-500/5 p-2 text-blue-700 dark:text-blue-400">
          District Coordinator view — restricted to: <strong>{coordinatorDistricts.join(", ")}</strong>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mobile, Aadhaar, name…" className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {PIPELINE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={postFilter} onValueChange={setPostFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {posts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={exportXlsx} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Export All
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 items-center rounded-md border bg-muted/40 p-2">
          <span className="text-xs font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("active")}>
            {bulkBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-600" />} Approve
          </Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("rejected")}>
            <X className="h-3.5 w-3.5 text-destructive" /> Reject
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-2">Page {page + 1} of {totalPages} · {count} total</div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No applications.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Aadhaar</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => {
                  const errs = validate(a);
                  const mismatch = a.amount_paid !== a.expected_amount;
                  return (
                    <TableRow key={a.id}>
                      <TableCell><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleOne(a.id)} /></TableCell>
                      <TableCell className="font-mono text-xs">{a.application_code}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {a.full_name}
                        {errs.length > 0 && (
                          <span title={errs.join("; ")} className="ml-1 inline-flex"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" /></span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{a.mobile}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {isAdmin || coordinatorDistricts.includes(a.district)
                          ? a.aadhaar
                          : maskAadhaar(a.aadhaar)}
                      </TableCell>
                      <TableCell className="text-xs">{a.post}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{a.district} › {a.block} › {a.panchayat}</TableCell>
                      <TableCell className={mismatch ? "text-destructive font-semibold whitespace-nowrap" : "whitespace-nowrap"}>
                        ₹{a.amount_paid} / ₹{a.expected_amount}
                      </TableCell>
                      <TableCell>
                        <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)} disabled={busyId === a.id}>
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <Badge variant="outline" className={pipelineBadge(a.status)}>{a.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" title="View" onClick={() => { setViewing(a); setNotes(a.admin_notes ?? ""); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Verify Aadhaar" onClick={() => { setAadhaarVerifying(a); setNotes(a.admin_notes ?? ""); setRejectReason(""); setRejectMode(false); }}>
                            <ScanLine className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" disabled={busyId === a.id} onClick={() => updateStatus(a.id, "active")}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" disabled={busyId === a.id} onClick={() => updateStatus(a.id, "rejected")}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification — {viewing?.application_code}</DialogTitle>
            <DialogDescription>Cross-check payment and identity, then approve or reject.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <Detail label="Name" value={viewing.full_name} />
                <Detail label="Post" value={viewing.post} />
                <Detail label="Mobile" value={viewing.mobile} />
                <Detail label="Aadhaar" value={isAdmin || coordinatorDistricts.includes(viewing.district) ? viewing.aadhaar : maskAadhaar(viewing.aadhaar)} mono />
                <Detail label="Email" value={viewing.email ?? "—"} />
                <Detail label="Location" value={`${viewing.district} › ${viewing.block} › ${viewing.panchayat}`} />
                <Detail label="Txn ID" value={viewing.transaction_id} mono />
                <div>
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className={viewing.amount_paid !== viewing.expected_amount ? "text-destructive font-semibold" : ""}>
                    ₹{viewing.amount_paid} / ₹{viewing.expected_amount}
                  </div>
                </div>
              </div>

              {(isAdmin || coordinatorDistricts.includes(viewing.district)) ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Payment screenshot</div>
                    <a href={viewing.payment_screenshot_url} target="_blank" rel="noopener" className="block">
                      <img loading="lazy" src={viewing.payment_screenshot_url} alt="Payment" className="rounded border max-h-72 w-full object-contain bg-muted" />
                    </a>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Aadhaar image</div>
                    {viewing.aadhaar_image_url ? (
                      <a href={viewing.aadhaar_image_url} target="_blank" rel="noopener" className="block">
                        <img loading="lazy" src={viewing.aadhaar_image_url} alt="Aadhaar" className="rounded border max-h-72 w-full object-contain bg-muted" />
                      </a>
                    ) : (
                      <div className="rounded border bg-muted p-6 text-center text-xs text-muted-foreground">No Aadhaar image uploaded</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                  Sensitive documents (Aadhaar &amp; payment screenshot) are restricted to admins and the assigned district coordinator.
                </div>
              )}

              {viewing.photo_url && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Applicant photo</div>
                  <a href={viewing.photo_url} target="_blank" rel="noopener">
                    <img loading="lazy" src={viewing.photo_url} alt="Applicant" className="rounded border max-h-48 object-contain bg-muted" />
                  </a>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-1">Admin notes</div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            {viewing && (
              <>
                <Button variant="outline" disabled={busyId === viewing.id} onClick={() => updateStatus(viewing.id, "verified", notes || null)}>Mark verified</Button>
                <Button variant="destructive" disabled={busyId === viewing.id} onClick={() => updateStatus(viewing.id, "rejected", notes || null)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button disabled={busyId === viewing.id} onClick={() => updateStatus(viewing.id, "active", notes || null)} className="bg-green-600 text-white hover:bg-green-700">
                  {busyId === viewing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aadhaar verification dialog */}
      <Dialog open={!!aadhaarVerifying} onOpenChange={(o) => { if (!o) { setAadhaarVerifying(null); setRejectMode(false); setRejectReason(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-blue-600" />
              Aadhaar Verification — {aadhaarVerifying?.application_code}
            </DialogTitle>
            <DialogDescription>
              Compare the uploaded Aadhaar image with the submitted Aadhaar number. Approve if it matches, or reject with a clear mismatch reason.
            </DialogDescription>
          </DialogHeader>
          {aadhaarVerifying && (
            <div className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <Detail label="Applicant" value={aadhaarVerifying.full_name} />
                <Detail
                  label="Submitted Aadhaar"
                  value={isAdmin || coordinatorDistricts.includes(aadhaarVerifying.district) ? aadhaarVerifying.aadhaar : maskAadhaar(aadhaarVerifying.aadhaar)}
                  mono
                />
              </div>

              {(isAdmin || coordinatorDistricts.includes(aadhaarVerifying.district)) ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                    <span>Uploaded Aadhaar image</span>
                    {aadhaarVerifying.aadhaar_image_url && (
                      <button type="button" onClick={() => setZoomImg(aadhaarVerifying.aadhaar_image_url!)} className="text-blue-600 inline-flex items-center gap-1 hover:underline">
                        <ZoomIn className="h-3 w-3" /> Zoom
                      </button>
                    )}
                  </div>
                  {aadhaarVerifying.aadhaar_image_url ? (
                    <a href={aadhaarVerifying.aadhaar_image_url} target="_blank" rel="noopener" className="block">
                      <img loading="lazy" src={aadhaarVerifying.aadhaar_image_url} alt="Aadhaar document" className="rounded border max-h-96 w-full object-contain bg-muted" />
                    </a>
                  ) : (
                    <div className="rounded border bg-muted p-8 text-center text-xs text-muted-foreground">
                      No Aadhaar image uploaded by applicant.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded border bg-muted/40 p-6 text-center text-xs text-muted-foreground">
                  Aadhaar image is restricted to admins and the assigned district coordinator.
                </div>
              )}

              {rejectMode ? (
                <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                  <div className="text-xs font-medium text-destructive">Select a mismatch reason (required)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {AADHAAR_REJECT_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRejectReason(r)}
                        className={`text-xs px-2 py-1 rounded border transition ${rejectReason === r ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background hover:bg-muted"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Or write a custom reason…"
                  />
                </div>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Admin notes (optional)</div>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            {aadhaarVerifying && !rejectMode && (
              <>
                <Button variant="outline" onClick={() => { setAadhaarVerifying(null); }}>Cancel</Button>
                <Button variant="destructive" onClick={() => setRejectMode(true)}>
                  <X className="h-4 w-4" /> Reject…
                </Button>
                <Button
                  disabled={busyId === aadhaarVerifying.id || !aadhaarVerifying.aadhaar_image_url}
                  onClick={() => updateStatus(aadhaarVerifying.id, "verified", notes ? `Aadhaar verified. ${notes}` : "Aadhaar verified")}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {busyId === aadhaarVerifying.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve Aadhaar
                </Button>
              </>
            )}
            {aadhaarVerifying && rejectMode && (
              <>
                <Button variant="outline" onClick={() => { setRejectMode(false); setRejectReason(""); }}>Back</Button>
                <Button
                  variant="destructive"
                  disabled={busyId === aadhaarVerifying.id || rejectReason.trim().length < 3}
                  onClick={() => updateStatus(aadhaarVerifying.id, "rejected", `Aadhaar rejected: ${rejectReason.trim()}`)}
                >
                  {busyId === aadhaarVerifying.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Confirm Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image zoom */}
      <Dialog open={!!zoomImg} onOpenChange={(o) => !o && setZoomImg(null)}>
        <DialogContent className="max-w-5xl p-2">
          {zoomImg && <img src={zoomImg} alt="Aadhaar zoom" className="w-full max-h-[85vh] object-contain" />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs break-all" : "break-words"}>{value}</div>
    </div>
  );
}
