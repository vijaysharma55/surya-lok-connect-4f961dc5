import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";
import { MediaPicker } from "@/components/admin/MediaPicker";

type Seo = {
  id: string;
  page_path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
};

export default function AdminSeo() {
  const [items, setItems] = useState<Seo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("seo_settings").select("*").order("page_path");
    setItems((data as Seo[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Seo>) =>
    setItems((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const save = async (s: Seo) => {
    const { id, ...rest } = s;
    const { error } = await supabase.from("seo_settings").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const create = async () => {
    const path = prompt("Page path (e.g. /new-page)");
    if (!path) return;
    const { data, error } = await supabase
      .from("seo_settings")
      .insert({ page_path: path, title: "", description: "" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setItems((p) => [...p, data as Seo]);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("seo_settings").delete().eq("id", id);
    setItems((p) => p.filter((s) => s.id !== id));
  };

  return (
    <AdminLayout title="SEO">
      <div className="flex justify-end mb-4">
        <Button onClick={create}><Plus className="h-4 w-4" />Add page SEO</Button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-4">
          {items.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{s.page_path}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Title (≤60 chars)</Label><Input maxLength={70} value={s.title ?? ""} onChange={(e) => update(s.id, { title: e.target.value })} /></div>
                <div><Label>Meta description (≤160 chars)</Label><Textarea rows={2} maxLength={200} value={s.description ?? ""} onChange={(e) => update(s.id, { description: e.target.value })} /></div>
                <div><Label>Keywords (comma-separated)</Label><Input value={s.keywords ?? ""} onChange={(e) => update(s.id, { keywords: e.target.value })} /></div>
                <div><Label>Canonical URL</Label><Input value={s.canonical_url ?? ""} onChange={(e) => update(s.id, { canonical_url: e.target.value })} /></div>
                <div><Label>Open Graph image</Label>
                  <MediaPicker value={s.og_image_url ?? ""} onChange={(url) => update(s.id, { og_image_url: url })} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save(s)}><Save className="h-4 w-4" />Save</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
