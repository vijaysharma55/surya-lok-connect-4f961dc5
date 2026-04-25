import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Search, Eye, Check, X, Trash2, ExternalLink } from "lucide-react";

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
  transaction_id: string;
  payment_screenshot_url: string;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
};

const statusBadgeClass = (s: string) => {
  if (s === "approved") return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
  if (s === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
  return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
};

export default function AdminApplications() {
  const [items, setItems] = useState<Application[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`applications-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected" | "pending", admin_notes?: string | null) => {
    const patch: any = { status, admin_notes: admin_notes ?? null };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status !== "approved") patch.approved_at = null;
    const { error } = await supabase.from("applications").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Application ${status}`);
    setViewing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this application permanently?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((a) => a.id !== id));
    toast.success("Deleted");
  };

  const filtered = items.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      a.full_name.toLowerCase().includes(t) ||
      a.mobile.includes(t) ||
      a.application_code.toLowerCase().includes(t) ||
      a.transaction_id.toLowerCase().includes(t) ||
      (a.email ?? "").toLowerCase().includes(t)
    );
  });

  return (
    <AdminLayout title="Applications">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, mobile, txn ID…" className="pl-8" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        Showing {filtered.length} of {items.length}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No applications.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.application_code}</TableCell>
                    <TableCell className="font-medium">{a.full_name}</TableCell>
                    <TableCell className="text-xs">{a.post}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.panchayat}, {a.block}, {a.district}</TableCell>
                    <TableCell className="text-xs"><a href={`tel:${a.mobile}`} className="hover:text-primary">{a.mobile}</a></TableCell>
                    <TableCell className="font-mono text-xs">{a.transaction_id}</TableCell>
                    <TableCell><Badge variant="outline" className={statusBadgeClass(a.status)}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setViewing(a); setNotes(a.admin_notes ?? ""); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {a.status === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(a.id, "approved")}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(a.id, "rejected")}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application — {viewing?.application_code}</DialogTitle>
            <DialogDescription>Verify payment and approve or reject.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <Detail label="Full Name" value={viewing.full_name} />
                <Detail label="Post" value={viewing.post} />
                <Detail label="Mobile" value={viewing.mobile} />
                <Detail label="Aadhaar" value={viewing.aadhaar} mono />
                <Detail label="Email" value={viewing.email ?? "—"} />
                <Detail label="District" value={viewing.district} />
                <Detail label="Block" value={viewing.block} />
                <Detail label="Panchayat" value={viewing.panchayat} />
                <Detail label="Amount" value={`₹${viewing.payment_amount}`} />
                <Detail label="Transaction ID" value={viewing.transaction_id} mono />
                <Detail label="Submitted" value={new Date(viewing.created_at).toLocaleString()} />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Status</div>
                  <Badge variant="outline" className={statusBadgeClass(viewing.status)}>{viewing.status}</Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Payment screenshot</div>
                  <a href={viewing.payment_screenshot_url} target="_blank" rel="noopener" className="block">
                    <img src={viewing.payment_screenshot_url} alt="Payment screenshot" className="rounded border max-h-64 w-full object-contain bg-muted" />
                    <div className="text-xs text-primary mt-1 inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Open full size
                    </div>
                  </a>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Applicant photo</div>
                  {viewing.photo_url ? (
                    <a href={viewing.photo_url} target="_blank" rel="noopener" className="block">
                      <img src={viewing.photo_url} alt="Applicant" className="rounded border max-h-64 w-full object-contain bg-muted" />
                    </a>
                  ) : (
                    <div className="rounded border bg-muted p-6 text-center text-xs text-muted-foreground">No photo uploaded</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Admin notes (shown to applicant if rejected)</div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            {viewing && (
              <>
                <Button variant="outline" onClick={() => updateStatus(viewing.id, "pending", notes || null)}>Mark pending</Button>
                <Button variant="destructive" onClick={() => updateStatus(viewing.id, "rejected", notes || null)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => updateStatus(viewing.id, "approved", notes || null)} className="bg-green-600 text-white hover:bg-green-700">
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
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
