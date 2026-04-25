-- Storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Storage policies (use existing has_role helper)
drop policy if exists "Public can view documents" on storage.objects;
create policy "Public can view documents"
on storage.objects for select
using (bucket_id = 'documents');

drop policy if exists "Admin can upload documents" on storage.objects;
create policy "Admin can upload documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admin can update documents" on storage.objects;
create policy "Admin can update documents"
on storage.objects for update
to authenticated
using (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'::app_role))
with check (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admin can delete documents" on storage.objects;
create policy "Admin can delete documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'::app_role));

-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  storage_path text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "Public read documents" on public.documents;
create policy "Public read documents"
on public.documents for select
using (true);

drop policy if exists "Admin insert documents" on public.documents;
create policy "Admin insert documents"
on public.documents for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admin update documents" on public.documents;
create policy "Admin update documents"
on public.documents for update
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role))
with check (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admin delete documents" on public.documents;
create policy "Admin delete documents"
on public.documents for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

create index if not exists idx_documents_created_at on public.documents (created_at desc);