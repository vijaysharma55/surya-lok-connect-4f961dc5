import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { MediaPicker } from "@/components/admin/MediaPicker";

export default function AdminSettings() {
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", "global").single()
      .then(({ data }) => setS(data));
  }, []);

  if (!s) return <AdminLayout title="Settings"><p className="text-sm text-muted-foreground">Loading…</p></AdminLayout>;

  const update = (patch: any) => setS({ ...s, ...patch });
  const updateSocial = (k: string, v: string) =>
    update({ social_links: { ...(s.social_links ?? {}), [k]: v } });

  const save = async () => {
    const { id, ...rest } = s;
    const { error } = await supabase.from("site_settings").update(rest).eq("id", "global");
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const social = s.social_links ?? {};

  return (
    <AdminLayout title="General settings">
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader><CardTitle className="text-base">Website</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Site name</Label><Input value={s.site_name ?? ""} onChange={(e) => update({ site_name: e.target.value })} /></div>
            <div><Label>Domain</Label><Input value={s.domain ?? ""} onChange={(e) => update({ domain: e.target.value })} /></div>
            <div><Label>Favicon</Label><MediaPicker value={s.favicon_url ?? ""} onChange={(v) => update({ favicon_url: v })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Hero (homepage)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Heading</Label><Input value={s.hero_heading ?? ""} onChange={(e) => update({ hero_heading: e.target.value })} /></div>
            <div><Label>Subheading</Label><Textarea rows={2} value={s.hero_subheading ?? ""} onChange={(e) => update({ hero_subheading: e.target.value })} /></div>
            <div><Label>Background image</Label><MediaPicker value={s.hero_image_url ?? ""} onChange={(v) => update({ hero_image_url: v })} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>CTA label</Label><Input value={s.hero_cta_label ?? ""} onChange={(e) => update({ hero_cta_label: e.target.value })} /></div>
              <div><Label>CTA link</Label><Input value={s.hero_cta_link ?? ""} onChange={(e) => update({ hero_cta_link: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Social links</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["facebook", "instagram", "youtube", "linkedin", "twitter"].map((k) => (
              <div key={k}><Label className="capitalize">{k}</Label>
                <Input value={social[k] ?? ""} onChange={(e) => updateSocial(k, e.target.value)} placeholder="https://…" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">WhatsApp floating button</CardTitle></CardHeader>
          <CardContent>
            <div><Label>WhatsApp number (E.164 without +)</Label>
              <Input value={s.whatsapp_number ?? ""} onChange={(e) => update({ whatsapp_number: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-4">
          <Button size="lg" onClick={save}><Save className="h-4 w-4" />Save settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
