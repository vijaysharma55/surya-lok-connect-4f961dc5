import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Download, Search, Phone, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  message: string;
  status: string;
  source: string | null;
  created_at: string;
};

const statuses = ["new", "contacted", "won", "lost"];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    toast.success("Updated");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Deleted");
  };

  const exportCsv = () => {
    const header = ["Name", "Phone", "Email", "Service", "Message", "Status", "Date"];
    const rows = filtered.map((l) => [
      l.name,
      l.phone,
      l.email ?? "",
      l.service,
      l.message.replace(/"/g, '""'),
      l.status,
      new Date(l.created_at).toISOString(),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter((l) => {
    const matchQ =
      !q ||
      l.name.toLowerCase().includes(q.toLowerCase()) ||
      l.phone.includes(q) ||
      l.service.toLowerCase().includes(q.toLowerCase());
    const matchS = statusFilter === "all" || l.status === statusFilter;
    return matchQ && matchS;
  });

  const statusColor = (s: string) =>
    s === "new" ? "bg-blue-100 text-blue-800" :
    s === "contacted" ? "bg-amber-100 text-amber-800" :
    s === "won" ? "bg-green-100 text-green-800" :
    "bg-gray-100 text-gray-800";

  return (
    <AdminLayout title="Leads">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / phone / service" className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No leads.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{l.name}</span>
                      <Badge variant="outline">{l.service}</Badge>
                      <Badge className={statusColor(l.status)}>{l.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex gap-3 flex-wrap">
                      <a className="hover:underline flex items-center gap-1" href={`tel:${l.phone}`}><Phone className="h-3 w-3" />{l.phone}</a>
                      <a
                        className="hover:underline flex items-center gap-1"
                        target="_blank"
                        rel="noopener"
                        href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`}
                      >
                        <MessageSquare className="h-3 w-3" />WhatsApp
                      </a>
                      <span>{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{l.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                      <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => remove(l.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
