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

type Service = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  benefits: string[];
  cta_label: string | null;
  cta_link: string | null;
  sort_order: number;
  published: boolean;
};

const empty: Omit<Service, "id"> = {
  slug: "",
  title: "",
  short_description: "",
  description: "",
  icon: "",
  image_url: "",
  benefits: [],
  cta_label: "",
  cta_link: "",
  sort_order: 0,
  published: true,
};

export default function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setItems(((data as any[]) ?? []).map((s) => ({ ...s, benefits: Array.isArray(s.benefits) ? s.benefits : [] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (s: Service) => {
    const { id, ...rest } = s;
    const { error } = await supabase.from("services").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const create = async () => {
    const slug = `service-${Date.now()}`;
    const { data, error } = await supabase
      .from("services")
      .insert({ ...empty, slug, title: "New service", sort_order: items.length })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setItems((p) => [...p, { ...(data as any), benefits: [] }]);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((s) => s.id !== id));
  };

  const update = (id: string, patch: Partial<Service>) =>
    setItems((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <AdminLayout title="Services">
      <div className="flex justify-end mb-4">
        <Button onClick={create}><Plus className="h-4 w-4" />Add service</Button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-4">
          {items.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{s.title || "Untitled"}</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={s.published} onCheckedChange={(v) => update(s.id, { published: v })} />
                    <span className="text-xs">Published</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Title</Label><Input value={s.title} onChange={(e) => update(s.id, { title: e.target.value })} /></div>
                  <div><Label>Slug</Label><Input value={s.slug} onChange={(e) => update(s.id, { slug: e.target.value })} /></div>
                  <div><Label>Icon (lucide name)</Label><Input value={s.icon ?? ""} onChange={(e) => update(s.id, { icon: e.target.value })} placeholder="Sun, HeartHandshake, Home" /></div>
                  <div><Label>Sort order</Label><Input type="number" value={s.sort_order} onChange={(e) => update(s.id, { sort_order: Number(e.target.value) })} /></div>
                </div>
                <div><Label>Short description</Label><Input value={s.short_description ?? ""} onChange={(e) => update(s.id, { short_description: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={3} value={s.description ?? ""} onChange={(e) => update(s.id, { description: e.target.value })} /></div>
                <div><Label>Benefits (one per line)</Label>
                  <Textarea rows={4} value={s.benefits.join("\n")} onChange={(e) => update(s.id, { benefits: e.target.value.split("\n").filter(Boolean) })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>CTA label</Label><Input value={s.cta_label ?? ""} onChange={(e) => update(s.id, { cta_label: e.target.value })} /></div>
                  <div><Label>CTA link</Label><Input value={s.cta_link ?? ""} onChange={(e) => update(s.id, { cta_link: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Image</Label>
                  <MediaPicker value={s.image_url ?? ""} onChange={(url) => update(s.id, { image_url: url })} />
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
