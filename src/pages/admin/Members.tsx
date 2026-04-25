import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { Search, Trash2, Mail, Phone, Download } from "lucide-react";

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

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "completed") return "default";
  if (s === "cancelled") return "destructive";
  return "secondary";
};

export default function AdminMembers() {
  const [items, setItems] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

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

  const exportCsv = () => {
    const headers = ["Name", "Phone", "Email", "Address", "Plan", "Status", "Submitted"];
    const rows = filtered.map((m) => [
      m.full_name, m.phone_number, m.email ?? "", m.address ?? "",
      m.membership_type, m.payment_status, new Date(m.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email…" className="pl-8" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />Export CSV
        </Button>
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
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.full_name}</div>
                      {m.address && <div className="text-xs text-muted-foreground line-clamp-1">{m.address}</div>}
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${m.phone_number}`} className="flex items-center gap-1 text-sm hover:text-primary">
                        <Phone className="h-3 w-3" />{m.phone_number}
                      </a>
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <Mail className="h-3 w-3" />{m.email}
                        </a>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline">{m.membership_type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(m.payment_status)}>{m.payment_status}</Badge>
                        <Select value={m.payment_status} onValueChange={(v) => updateStatus(m.id, v)}>
                          <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
