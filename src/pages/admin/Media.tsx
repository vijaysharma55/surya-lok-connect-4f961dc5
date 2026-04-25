import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Copy, Search } from "lucide-react";

type Media = {
  id: string;
  url: string;
  storage_path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  created_at: string;
};

export default function AdminMedia() {
  const [items, setItems] = useState<Media[]>([]);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Media[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB`);
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (upErr) { toast.error(upErr.message); continue; }
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const { error: insErr } = await supabase.from("media").insert({
        storage_path: path,
        url: publicUrl,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (insErr) toast.error(insErr.message);
    }
    setUploading(false);
    load();
    toast.success("Uploaded");
  };

  const remove = async (m: Media) => {
    if (!confirm(`Delete ${m.filename}?`)) return;
    await supabase.storage.from("media").remove([m.storage_path]);
    const { error } = await supabase.from("media").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((x) => x.id !== m.id));
    toast.success("Deleted");
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  const filtered = items.filter((i) => !q || i.filename.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminLayout title="Media library">
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filename" className="pl-8" />
        </div>
        <label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button asChild disabled={uploading}>
            <span><Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}</span>
          </Button>
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No media yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((m) => (
            <Card key={m.id} className="overflow-hidden group">
              <div className="aspect-square bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt_text ?? m.filename} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-2 space-y-1">
                <div className="text-xs truncate" title={m.filename}>{m.filename}</div>
                <div className="flex justify-between gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(m.url)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => remove(m)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
