import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Project = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  sort_order: number;
  published: boolean;
};

const CATEGORIES = ["csr", "solar", "property", "team"];

export default function AdminProjects() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setItems((data as Project[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data, error } = await supabase
      .from("projects")
      .insert({ title: "New project", category: "csr", sort_order: items.length, published: true })
      .select().single();
    if (error) return toast.error(error.message);
    setItems((p) => [...p, data as Project]);
    toast.success("Project added");
  };

  const save = async (p: Project) => {
    const { id, ...rest } = p;
    const { error } = await supabase.from("projects").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success("Deleted");
  };

  const update = (id: string, patch: Partial<Project>) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <AdminLayout title="Projects gallery">
      <div className="flex justify-end mb-4">
        <Button onClick={create}><Plus className="h-4 w-4" />Add project</Button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base truncate">{p.title || "Untitled"}</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={p.published} onCheckedChange={(v) => update(p.id, { published: v })} />
                    <span className="text-xs">Published</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Title</Label>
                  <Input value={p.title} onChange={(e) => update(p.id, { title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Category</Label>
                    <Select value={p.category} onValueChange={(v) => update(p.id, { category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Sort order</Label>
                    <Input type="number" value={p.sort_order}
                      onChange={(e) => update(p.id, { sort_order: Number(e.target.value) })} />
                  </div>
                </div>
                <div><Label>Description</Label>
                  <Textarea rows={2} value={p.description ?? ""}
                    onChange={(e) => update(p.id, { description: e.target.value })} />
                </div>
                <div><Label>Image</Label>
                  <MediaPicker value={p.image_url ?? ""} onChange={(url) => update(p.id, { image_url: url })} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save(p)}><Save className="h-4 w-4" />Save</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <Card className="sm:col-span-2"><CardContent className="p-8 text-center text-muted-foreground">
              No projects yet. Click "Add project" to create one.
            </CardContent></Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
