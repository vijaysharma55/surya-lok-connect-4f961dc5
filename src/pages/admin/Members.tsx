import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Trash2, Download, FileSpreadsheet, Eye, Check, X, Loader2 } from "lucide-react";

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  address: string | null;
  membership_type: string;
  payment_status: string;
  status: string;
  expected_amount: number;
  amount_paid: number;
  aadhaar: string | null;
  district: string | null;
  notes: string | null;
  created_at: string;
};

const PIPELINE = ["pending", "verified", "active", "rejected"];
const PAGE_SIZE = 20;

const pipelineBadge = (s: string) => {
  if (s === "active") return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
  if (s === "verified") return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
  if (s === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
  return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
};

const useDebounced = <T,>(v: T, ms = 350) => {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
};

export default function AdminMembers() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Member[]>([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<Member | null>(null);
  const debouncedQ = useDebounced(q);

  useEffect(() => { setPage(0); }, [debouncedQ, statusFilter]);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("memberships")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (debouncedQ.trim()) {
      const t = debouncedQ.trim();
      query = query.or(`phone_number.ilike.%${t}%,full_name.ilike.%${t}%,aadhaar.ilike.%${t}%`);
    }
    query = query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error, count: c } = await query;
    if (error) toast.error(error.message);
    setItems((data as Member[]) ?? []);
    setCount(c ?? 0);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [debouncedQ, statusFilter, page]);

  useEffect(() => {
    const channel = supabase
      .channel(`memberships-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "memberships" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    const { error } = await supabase.from("memberships").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    setItems((p) => p.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const bulkAction = async (status: "active" | "rejected") => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const { error } = await supabase.from("memberships").update({ status }).in("id", Array.from(selected));
    setBulkBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${selected.size} record(s) marked ${status}`);
    load();
  };

  const remove = async (id: string) => {
    if (!isAdmin) return toast.error("Only admins can delete");
    if (!confirm("Delete this member application?")) return;
    const { error } = await supabase.from("memberships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((m) => m.id !== id));
    toast.success("Deleted");
  };

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data as Member[]).map((m) => ({
        Name: m.full_name,
        Email: m.email ?? "",
        Phone: m.phone_number,
        Aadhaar: m.aadhaar ?? "",
        Address: m.address ?? "",
        District: m.district ?? "",
        "Membership Type": m.membership_type,
        Status: m.status,
        "Payment Status": m.payment_status,
        "Amount Paid": m.amount_paid ?? 0,
        "Expected Amount": m.expected_amount ?? 0,
        Notes: m.notes ?? "",
        "Date Joined": new Date(m.created_at).toLocaleString(),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      XLSX.writeFile(wb, `members-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${rows.length} members`);
    } catch (e: any) {
      toast.error(e.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <AdminLayout title="Members">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by mobile, name or Aadhaar…" className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PIPELINE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={exportXlsx} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Export
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 items-center rounded-md border bg-muted/40 p-2">
          <span className="text-xs font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("active")}>
            <Check className="h-3.5 w-3.5 text-green-600" /> Approve
          </Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("rejected")}>
            <X className="h-3.5 w-3.5 text-destructive" /> Reject
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-2">
        Page {page + 1} of {totalPages} · {count} total
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No members.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Aadhaar</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((m) => {
                  const mismatch = (m.expected_amount ?? 0) > 0 && m.amount_paid !== m.expected_amount;
                  return (
                    <TableRow key={m.id}>
                      <TableCell><Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggleOne(m.id)} /></TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{m.full_name}</TableCell>
                      <TableCell className="text-xs">{m.phone_number}</TableCell>
                      <TableCell className="font-mono text-xs">{m.aadhaar ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{m.membership_type}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={m.payment_status === "completed" ? "bg-green-500/15 text-green-700 border-green-500/30" : "bg-yellow-500/15 text-yellow-700 border-yellow-500/30"}>{m.payment_status}</Badge></TableCell>
                      <TableCell className={mismatch ? "text-destructive font-semibold" : ""}>
                        ₹{m.amount_paid ?? 0} / ₹{m.expected_amount ?? 0}
                      </TableCell>
                      <TableCell>
                        <Select value={m.status} onValueChange={(v) => updateStatus(m.id, v)} disabled={busyId === m.id}>
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <Badge variant="outline" className={pipelineBadge(m.status)}>{m.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewing(m)}><Eye className="h-4 w-4" /></Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>Full record</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <Detail label="Name" value={viewing.full_name} />
              <Detail label="Phone" value={viewing.phone_number} />
              <Detail label="Email" value={viewing.email ?? "—"} />
              <Detail label="Aadhaar" value={viewing.aadhaar ?? "—"} mono />
              <Detail label="Address" value={viewing.address ?? "—"} />
              <Detail label="District" value={viewing.district ?? "—"} />
              <Detail label="Plan" value={viewing.membership_type} />
              <Detail label="Status" value={viewing.status} />
              <Detail label="Amount" value={`₹${viewing.amount_paid} / ₹${viewing.expected_amount}`} />
              <Detail label="Submitted" value={new Date(viewing.created_at).toLocaleString()} />
            </div>
          )}
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
