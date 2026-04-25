import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

type Media = { id: string; url: string; filename: string };

export const MediaPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    supabase
      .from("media")
      .select("id,url,filename")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Media[]) ?? []));

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleDirectUpload = async (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const { error: insErr } = await supabase.from("media").insert({
        storage_path: path,
        url: publicUrl,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (insErr) throw insErr;
      onChange(publicUrl);
      toast.success("Uploaded");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center flex-wrap">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL or upload…"
          className="flex-1 min-w-[180px]"
        />
        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleDirectUpload(e.target.files?.[0])}
          />
          <Button asChild type="button" variant="outline" disabled={uploading}>
            <span><Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}</span>
          </Button>
        </label>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline"><ImageIcon className="h-4 w-4" />Library</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Choose an image</DialogTitle></DialogHeader>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No media. Upload to add some.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[60vh] overflow-auto">
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { onChange(m.url); setOpen(false); }}
                    className="aspect-square rounded border hover:ring-2 hover:ring-primary overflow-hidden"
                  >
                    <img src={m.url} alt={m.filename} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} aria-label="Clear">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <img src={value} alt="" className="h-24 rounded border object-cover" />
      )}
    </div>
  );
};
