-- Fix: search_path on helper
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Fix: leads insert policy - replace permissive true with bounded validation
drop policy if exists "Anyone can submit a lead" on public.leads;
create policy "Public submits bounded lead" on public.leads
  for insert to anon, authenticated
  with check (
    char_length(name) between 2 and 120
    and char_length(phone) between 7 and 20
    and char_length(service) between 1 and 60
    and char_length(message) between 5 and 2000
    and (email is null or char_length(email) <= 254)
  );

-- Fix: bucket listing - drop broad SELECT and replace with admin-only listing.
-- Public file URLs still work because storage.objects.bucket_id 'media' is public=true at the bucket level for direct GET via /object/public path.
drop policy if exists "Public reads media bucket" on storage.objects;
create policy "Admins list media bucket" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
