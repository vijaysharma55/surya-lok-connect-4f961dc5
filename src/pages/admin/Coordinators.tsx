import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, UserPlus, Loader2 } from "lucide-react";

type Assignment = {
  id: string;
  user_id: string;
  district: string;
  block: string | null;
  panchayat: string | null;
  created_at: string;
};

type Profile = { id: string; email: string | null; display_name: string | null };
type Role = { key: string; label: string };

export default function AdminCoordinators() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [districts, setDistricts] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userId, setUserId] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [panchayat, setPanchayat] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [aRes, lRes, rRes] = await Promise.all([
      supabase.from("coordinator_assignments").select("*").order("created_at", { ascending: false }),
      supabase.from("locations").select("name,type").eq("type", "district").order("name"),
      supabase.from("roles_catalog").select("key,label").order("sort_order"),
    ]);
    const list = (aRes.data as Assignment[]) ?? [];
    setAssignments(list);
    setDistricts(((lRes.data as any[]) ?? []).map((d) => d.name));
    setRoles((rRes.data as Role[]) ?? []);

    const ids = Array.from(new Set(list.map((a) => a.user_id)));
    if (ids.length > 0) {
      const { data: p } = await supabase.from("profiles").select("id,email,display_name").in("id", ids);
      const map: Record<string, Profile> = {};
      (p ?? []).forEach((x: any) => { map[x.id] = x; });
      setProfiles(map);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!userId.trim() || !district) {
      toast.error("User ID and district required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("coordinator_assignments").insert({
      user_id: userId.trim(),
      district,
      block: block || null,
      panchayat: panchayat || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Coordinator assigned");
    setUserId(""); setDistrict(""); setBlock(""); setPanchayat("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    const { error } = await supabase.from("coordinator_assignments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    setAssignments((p) => p.filter((a) => a.id !== id));
  };

  return (
    <AdminLayout title="Coordinators">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" /> Assign coordinator to district</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <Label>User ID (auth UID)</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID from Auth" />
          </div>
          <div>
            <Label>District</Label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Block (optional)</Label>
            <Input value={block} onChange={(e) => setBlock(e.target.value)} />
          </div>
          <div>
            <Label>Panchayat (optional)</Label>
            <Input value={panchayat} onChange={(e) => setPanchayat(e.target.value)} />
          </div>
          <div className="sm:col-span-5">
            <Button onClick={add} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Available roles</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {roles.map((r) => <Badge key={r.key} variant="outline">{r.label}</Badge>)}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Panchayat</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No coordinators assigned yet.</TableCell></TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="text-sm">{profiles[a.user_id]?.email ?? "—"}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{a.user_id}</div>
                    </TableCell>
                    <TableCell>{a.district}</TableCell>
                    <TableCell>{a.block ?? "—"}</TableCell>
                    <TableCell>{a.panchayat ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
