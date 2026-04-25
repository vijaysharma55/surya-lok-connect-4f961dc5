import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trash2, ExternalLink, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  validatePDF,
  type DocumentRow,
} from "@/lib/documents";

export default function AdminDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setDocs(await getDocuments());
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onFileChange = (f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    try {
      validatePDF(f);
      setFile(f);
    } catch (e: any) {
      toast.error(e.message);
      if (fileRef.current) fileRef.current.value = "";
      setFile(null);
    }
  };

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Please choose a PDF file");
      return;
    }
    if (title.trim().length < 2) {
      toast.error("Title must be at least 2 characters");
      return;
    }
    setUploading(true);
    try {
      const row = await uploadDocument(file, title, user.id);
      setDocs((prev) => [row, ...prev]);
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Document uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (doc: DocumentRow) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id, doc.storage_path ?? doc.file_url);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Documents">
      <div className="space-y-6">
        <form
          onSubmit={onUpload}
          className="rounded-lg border bg-card p-4 sm:p-6 space-y-4"
        >
          <div>
            <h2 className="text-base font-semibold">Upload PDF document</h2>
            <p className="text-xs text-muted-foreground">
              PDF only, max 5MB. Files are publicly downloadable once uploaded.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Report 2025"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">PDF file</Label>
              <Input
                id="doc-file"
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </form>

        <div className="rounded-lg border bg-card">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-base font-semibold">Uploaded documents</h2>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading…" : `${docs.length} file${docs.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
            </div>
          ) : docs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No documents uploaded yet.
            </div>
          ) : (
            <ul className="divide-y">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="p-4 sm:px-6 flex items-center gap-3 justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{d.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild size="sm" variant="outline">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(d)}
                      disabled={deletingId === d.id}
                    >
                      {deletingId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
