import { supabase } from "@/integrations/supabase/client";

export type DocumentRow = {
  id: string;
  title: string;
  file_url: string;
  storage_path: string | null;
  uploaded_by: string | null;
  created_at: string;
};

const BUCKET = "documents";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validatePDF(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File size must be under 5MB");
  }
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadDocument(file: File, title: string, userId: string) {
  validatePDF(file);
  if (!title || title.trim().length < 2) {
    throw new Error("Title is required");
  }

  const path = `docs/${Date.now()}_${sanitizeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = pub.publicUrl;

  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      title: title.trim(),
      file_url: fileUrl,
      storage_path: path,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (dbError) {
    // Best-effort cleanup if DB insert fails
    await supabase.storage.from(BUCKET).remove([path]);
    throw dbError;
  }

  return data as DocumentRow;
}

export async function getDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function getDocumentsPaginated(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function deleteDocument(id: string, fileUrlOrPath: string) {
  const path = fileUrlOrPath.includes(`/${BUCKET}/`)
    ? fileUrlOrPath.split(`/${BUCKET}/`)[1]
    : fileUrlOrPath;

  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
