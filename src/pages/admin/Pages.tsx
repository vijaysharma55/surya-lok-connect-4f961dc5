import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaPicker } from "@/components/admin/MediaPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Page = { id: string; slug: string; title: string; subtitle: string | null; published: boolean };
type Section = {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  heading: string | null;
  subheading: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  sort_order: number;
  visible: boolean;
};

const SECTION_TYPES = ["hero", "about", "features", "cta", "gallery", "text", "stats", "testimonials"];

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPages = async () => {
    const { data } = await supabase.from("pages").select("*").order("slug");
    const list = (data as Page[]) ?? [];
    setPages(list);
    if (!active && list.length) setActive(list[0].id);
    setLoading(false);
  };

  const loadSections = async (pageId: string) => {
    const { data } = await supabase.from("page_sections").select("*").eq("page_id", pageId).order("sort_order");
    setSections((data as Section[]) ?? []);
  };

  useEffect(() => { loadPages(); }, []);
  useEffect(() => { if (active) loadSections(active); }, [active]);

  const savePage = async (p: Page) => {
    const { error } = await supabase.from("pages").update({ title: p.title, subtitle: p.subtitle, published: p.published }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Page saved");
  };

  const addSection = async () => {
    if (!active) return;
    const { data, error } = await supabase.from("page_sections").insert({
      page_id: active,
      section_key: `section-${Date.now()}`,
      section_type: "text",
      heading: "New section",
      sort_order: sections.length,
    }).select().single();
    if (error) return toast.error(error.message);
    setSections((p) => [...p, data as Section]);
  };

  const saveSection = async (s: Section) => {
    const { id, ...rest } = s;
    const { error } = await supabase.from("page_sections").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Section saved");
  };

  const removeSection = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    await supabase.from("page_sections").delete().eq("id", id);
    setSections((p) => p.filter((s) => s.id !== id));
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= sections.length) return;
    const a = sections[idx], b = sections[next];
    const arr = [...sections];
    arr[idx] = { ...b, sort_order: a.sort_order };
    arr[next] = { ...a, sort_order: b.sort_order };
    setSections(arr);
    await Promise.all([
      supabase.from("page_sections").update({ sort_order: a.sort_order }).eq("id", b.id),
      supabase.from("page_sections").update({ sort_order: b.sort_order }).eq("id", a.id),
    ]);
  };

  const updateSection = (id: string, patch: Partial<Section>) =>
    setSections((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const updatePage = (patch: Partial<Page>) =>
    setPages((p) => p.map((pg) => (pg.id === active ? { ...pg, ...patch } : pg)));

  const activePage = pages.find((p) => p.id === active);

  if (loading) return <AdminLayout title="Pages"><p className="text-sm text-muted-foreground">Loading…</p></AdminLayout>;

  return (
    <AdminLayout title="Pages">
      <Tabs value={active ?? undefined} onValueChange={setActive}>
        <TabsList className="flex flex-wrap h-auto">
          {pages.map((p) => (
            <TabsTrigger key={p.id} value={p.id}>{p.title}</TabsTrigger>
          ))}
        </TabsList>

        {pages.map((p) => (
          <TabsContent key={p.id} value={p.id} className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Page details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Title</Label><Input value={p.title} onChange={(e) => updatePage({ title: e.target.value })} /></div>
                <div><Label>Subtitle</Label><Input value={p.subtitle ?? ""} onChange={(e) => updatePage({ subtitle: e.target.value })} /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.published} onCheckedChange={(v) => updatePage({ published: v })} />
                  <span className="text-sm">Published</span>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => savePage(pages.find((x) => x.id === p.id)!)}><Save className="h-4 w-4" />Save page</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Sections</h2>
              <Button onClick={addSection}><Plus className="h-4 w-4" />Add section</Button>
            </div>

            {sections.length === 0 && (
              <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">No sections yet.</CardContent></Card>
            )}

            {sections.map((s, idx) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
                  <CardTitle className="text-sm">{s.heading || s.section_key}</CardTitle>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2 mr-2">
                      <Switch checked={s.visible} onCheckedChange={(v) => updateSection(s.id, { visible: v })} />
                      <span className="text-xs">Visible</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} aria-label="Up"><ChevronUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} aria-label="Down"><ChevronDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeSection(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={s.section_type} onValueChange={(v) => updateSection(s.id, { section_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SECTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Key</Label><Input value={s.section_key} onChange={(e) => updateSection(s.id, { section_key: e.target.value })} /></div>
                  </div>
                  <div><Label>Heading</Label><Input value={s.heading ?? ""} onChange={(e) => updateSection(s.id, { heading: e.target.value })} /></div>
                  <div><Label>Subheading</Label><Input value={s.subheading ?? ""} onChange={(e) => updateSection(s.id, { subheading: e.target.value })} /></div>
                  <div><Label>Body</Label>
                    <RichTextEditor value={s.body ?? ""} onChange={(html) => updateSection(s.id, { body: html })} />
                  </div>
                  <div><Label>Image</Label>
                    <MediaPicker value={s.image_url ?? ""} onChange={(url) => updateSection(s.id, { image_url: url })} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label>CTA label</Label><Input value={s.cta_label ?? ""} onChange={(e) => updateSection(s.id, { cta_label: e.target.value })} /></div>
                    <div><Label>CTA link</Label><Input value={s.cta_link ?? ""} onChange={(e) => updateSection(s.id, { cta_link: e.target.value })} /></div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSection(s)}><Save className="h-4 w-4" />Save section</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </AdminLayout>
  );
}
