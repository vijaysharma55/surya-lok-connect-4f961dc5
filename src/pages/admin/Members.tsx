import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Search, Trash2, Mail, Phone, Download, FileSpreadsheet, Eye } from "lucide-react";

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  address: string | null;
  membership_type: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
};

const STATUSES = ["pending", "completed", "cancelled"];

// Color-coded badges: green (paid), yellow (pending), red (cancelled)
const statusBadgeClass = (s: string) => {
  if (s === "completed")
    return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/20";
  if (s === "cancelled")
    return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/20";
  return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20";
};

export default function AdminMembers() {
  const [items, setItems] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Member | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Member[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`memberships-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "memberships" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, payment_status: string) => {
    setItems((p) => p.map((m) => (m.id === id ? { ...m, payment_status } : m)));
    const { error } = await supabase.from("memberships").update({ payment_status }).eq("id", id);
    if (error) { toast.error(error.message); load(); return; }
    toast.success("Status updated");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this member application?")) return;
    const { error } = await supabase.from("memberships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((m) => m.id !== id));
    toast.success("Deleted");
  };

  const exportRows = () =>
    filtered.map((m) => ({
      Name: m.full_name,
      Email: m.email ?? "",
      Phone: m.phone_number,
      Address: m.address ?? "",
      "Membership Type": m.membership_type,
      "Payment Status": m.payment_status,
      Notes: m.notes ?? "",
      "Date Joined": new Date(m.created_at).toLocaleString(),
    }));

  const exportXlsx = () => {
    if (filtered.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(exportRows());
    ws["!cols"] = [{ wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `members-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${filtered.length} members to Excel`);
  };

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const rows = exportRows();
    const headers = Object.keys(rows[0]);
    const csv = [
      headers,
      ...rows.map((r) => headers.map((h) => (r as any)[h])),
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} members to CSV`);
  };

  const filtered = items.filter((m) => {
    if (filterStatus !== "all" && m.payment_status !== filterStatus) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(t) ||
      m.phone_number.toLowerCase().includes(t) ||
      (m.email ?? "").toLowerCase().includes(t) ||
      m.membership_type.toLowerCase().includes(t)
    );
  });

  return (
    <AdminLayout title="Members">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or phone…"
            className="pl-8"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />CSV
        </Button>
        <Button onClick={exportXlsx} disabled={filtered.length === 0}>
          <FileSpreadsheet className="h-4 w-4" />Export to Excel
        </Button>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        Showing {filtered.length} of {items.length} member{items.length === 1 ? "" : "s"}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No members yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Membership Type</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell>
                      {m.email ? (
                        <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-sm hover:text-primary">
                          <Mail className="h-3 w-3" />{m.email}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${m.phone_number}`} className="flex items-center gap-1 text-sm hover:text-primary">
                        <Phone className="h-3 w-3" />{m.phone_number}
                      </a>
                    </TableCell>
                    <TableCell><Badge variant="outline">{m.membership_type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusBadgeClass(m.payment_status)}>
                          {m.payment_status}
                        </Badge>
                        <Select value={m.payment_status} onValueChange={(v) => updateStatus(m.id, v)}>
                          <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewing(m)}>
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">View</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>Full application record</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <Detail label="Full Name" value={viewing.full_name} />
              <Detail label="Email" value={viewing.email ?? "—"} />
              <Detail label="Phone Number" value={viewing.phone_number} />
              <Detail label="Address" value={viewing.address ?? "—"} />
              <Detail label="Membership Type" value={viewing.membership_type} />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Payment Status</div>
                <Badge variant="outline" className={statusBadgeClass(viewing.payment_status)}>
                  {viewing.payment_status}
                </Badge>
              </div>
              <Detail label="Notes" value={viewing.notes ?? "—"} />
              <Detail label="Submitted" value={new Date(viewing.created_at).toLocaleString()} />
              <Detail label="Member ID" value={viewing.id} mono />
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
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className={mono ? "font-mono text-xs break-all" : "break-words"}>{value}</div>
    </div>
  );
}
