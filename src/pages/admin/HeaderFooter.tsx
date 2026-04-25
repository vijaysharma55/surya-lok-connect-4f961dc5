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

type NavLink = { label: string; to: string };
type Settings = {
  id: string;
  site_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  brand_tagline: string | null;
  email: string | null;
  phones: string[];
  whatsapp_number: string | null;
  address: string | null;
  hours: string | null;
  compliance: string[];
  social_links: Record<string, string>;
  nav_links: NavLink[];
  footer_text: string | null;
  cta_banner_text: string | null;
  cta_banner_link: string | null;
  cta_banner_label: string | null;
  hero_heading: string | null;
  hero_subheading: string | null;
  hero_image_url: string | null;
  hero_cta_label: string | null;
  hero_cta_link: string | null;
};

export default function AdminHeaderFooter() {
  const [s, setS] = useState<Settings | null>(null);

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", "global").single()
      .then(({ data }) => setS(data as any));
  }, []);

  if (!s) return <AdminLayout title="Header & Footer"><p className="text-sm text-muted-foreground">Loading…</p></AdminLayout>;

  const update = (patch: Partial<Settings>) => setS({ ...s, ...patch });

  const save = async () => {
    const payload = { ...s, id: "global" };
    const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });
    if (error) return toast.error(error.message);
    toast.success("Header & footer saved");
  };

  const updateNav = (i: number, patch: Partial<NavLink>) => {
    const arr = [...(s.nav_links ?? [])];
    arr[i] = { ...arr[i], ...patch };
    update({ nav_links: arr });
  };
  const addNav = () => update({ nav_links: [...(s.nav_links ?? []), { label: "New", to: "/" }] });
  const removeNav = (i: number) => update({ nav_links: (s.nav_links ?? []).filter((_, idx) => idx !== i) });

  const updatePhone = (i: number, v: string) => {
    const arr = [...(s.phones ?? [])]; arr[i] = v; update({ phones: arr });
  };
  const addPhone = () => update({ phones: [...(s.phones ?? []), ""] });
  const removePhone = (i: number) => update({ phones: (s.phones ?? []).filter((_, idx) => idx !== i) });

  return (
    <AdminLayout title="Header & Footer">
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader><CardTitle className="text-base">Header / Branding</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Site name</Label><Input value={s.site_name ?? ""} onChange={(e) => update({ site_name: e.target.value })} /></div>
            <div><Label>Tagline</Label><Input value={s.brand_tagline ?? ""} onChange={(e) => update({ brand_tagline: e.target.value })} /></div>
            <div><Label>Logo</Label><MediaPicker value={s.logo_url ?? ""} onChange={(v) => update({ logo_url: v })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Navigation</CardTitle>
            <Button size="sm" onClick={addNav}><Plus className="h-4 w-4" />Add</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(s.nav_links ?? []).map((n, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Label" value={n.label} onChange={(e) => updateNav(i, { label: e.target.value })} />
                <Input placeholder="/path" value={n.to} onChange={(e) => updateNav(i, { to: e.target.value })} />
                <Button variant="ghost" size="icon" onClick={() => removeNav(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contact</CardTitle>
            <Button size="sm" onClick={addPhone}><Plus className="h-4 w-4" />Phone</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(s.phones ?? []).map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input value={p} onChange={(e) => updatePhone(i, e.target.value)} placeholder="Phone number" />
                <Button variant="ghost" size="icon" onClick={() => removePhone(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <div><Label>WhatsApp number (E.164, e.g. 9175…)</Label><Input value={s.whatsapp_number ?? ""} onChange={(e) => update({ whatsapp_number: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={s.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={s.address ?? ""} onChange={(e) => update({ address: e.target.value })} /></div>
            <div><Label>Hours</Label><Input value={s.hours ?? ""} onChange={(e) => update({ hours: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Footer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Footer text</Label><Textarea rows={2} value={s.footer_text ?? ""} onChange={(e) => update({ footer_text: e.target.value })} /></div>
            <div><Label>CTA banner heading</Label><Input value={s.cta_banner_text ?? ""} onChange={(e) => update({ cta_banner_text: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>CTA button label</Label><Input value={s.cta_banner_label ?? ""} onChange={(e) => update({ cta_banner_label: e.target.value })} /></div>
              <div><Label>CTA button link</Label><Input value={s.cta_banner_link ?? ""} onChange={(e) => update({ cta_banner_link: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-4">
          <Button size="lg" onClick={save}><Save className="h-4 w-4" />Save all</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
