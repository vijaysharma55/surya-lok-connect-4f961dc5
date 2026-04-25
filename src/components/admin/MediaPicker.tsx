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
import { Image as ImageIcon, X } from "lucide-react";

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

  useEffect(() => {
    if (!open) return;
    supabase
      .from("media")
      .select("id,url,filename")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Media[]) ?? []));
  }, [open]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste image URL or pick…" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline"><ImageIcon className="h-4 w-4" />Pick</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Choose an image</DialogTitle></DialogHeader>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No media. Upload some in Media library.</p>
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
