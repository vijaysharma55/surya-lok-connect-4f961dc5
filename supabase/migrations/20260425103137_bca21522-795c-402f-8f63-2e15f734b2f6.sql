-- ===== ROLES =====
create type public.app_role as enum ('admin', 'editor', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== PROFILES =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== updated_at helper =====
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ===== LEADS =====
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  service text not null,
  message text not null,
  status text not null default 'new',
  source text default 'website',
  created_at timestamptz not null default now()
);
alter table public.leads enable row level security;

create policy "Anyone can submit a lead" on public.leads
  for insert to anon, authenticated with check (true);
create policy "Admins read leads" on public.leads
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update leads" on public.leads
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete leads" on public.leads
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ===== SERVICES =====
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  description text,
  icon text,
  image_url text,
  benefits jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  cta_label text,
  cta_link text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.services enable row level security;
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

create policy "Public reads published services" on public.services
  for select to anon, authenticated using (published = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage services" on public.services
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== PAGES + SECTIONS =====
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pages enable row level security;
create trigger pages_updated before update on public.pages
  for each row execute function public.set_updated_at();

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  heading text,
  subheading text,
  body text,
  image_url text,
  cta_label text,
  cta_link text,
  data jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, section_key)
);
alter table public.page_sections enable row level security;
create trigger page_sections_updated before update on public.page_sections
  for each row execute function public.set_updated_at();

create policy "Public reads published pages" on public.pages
  for select to anon, authenticated using (published = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage pages" on public.pages
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Public reads visible sections" on public.page_sections
  for select to anon, authenticated using (visible = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage sections" on public.page_sections
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== MEDIA =====
create table public.media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  url text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  width int,
  height int,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;

create policy "Public reads media" on public.media
  for select to anon, authenticated using (true);
create policy "Admins manage media" on public.media
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== SITE SETTINGS =====
create table public.site_settings (
  id text primary key,
  site_name text,
  domain text,
  logo_url text,
  favicon_url text,
  brand_tagline text,
  email text,
  phones jsonb not null default '[]'::jsonb,
  whatsapp_number text,
  address text,
  hours text,
  compliance jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  nav_links jsonb not null default '[]'::jsonb,
  footer_text text,
  cta_banner_text text,
  cta_banner_link text,
  cta_banner_label text,
  hero_heading text,
  hero_subheading text,
  hero_image_url text,
  hero_cta_label text,
  hero_cta_link text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create trigger site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

create policy "Public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "Admins manage site settings" on public.site_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== SEO SETTINGS =====
create table public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  page_path text unique not null,
  title text,
  description text,
  keywords text,
  og_image_url text,
  canonical_url text,
  updated_at timestamptz not null default now()
);
alter table public.seo_settings enable row level security;
create trigger seo_settings_updated before update on public.seo_settings
  for each row execute function public.set_updated_at();

create policy "Public reads seo" on public.seo_settings
  for select to anon, authenticated using (true);
create policy "Admins manage seo" on public.seo_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== STORAGE BUCKET =====
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public reads media bucket" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy "Admins upload to media bucket" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update media bucket" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete media bucket" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

-- ===== SEED DATA =====
insert into public.site_settings (id, site_name, domain, brand_tagline, email, phones, whatsapp_number, address, hours, compliance, hero_heading, hero_subheading, hero_cta_label, hero_cta_link, footer_text, cta_banner_text, cta_banner_label, cta_banner_link, nav_links, social_links)
values (
  'global',
  'Surya Lok Kalyan Foundation',
  'www.suryalok.online',
  'सूरज की रोशनी से समाज की रोशनी तक',
  'slkf02026@gmail.com',
  '["7520585153","7319935455"]'::jsonb,
  '917520585153',
  'Mithapur, Patna, Bihar, India',
  '9:15 AM – 5:00 PM (Sunday closed)',
  '["80G","12A","10AC"]'::jsonb,
  'Empowering communities. Powering futures.',
  'CSR projects, solar energy, and trusted property services from Patna, Bihar.',
  'Talk to Us',
  '/contact',
  '© Surya Lok Kalyan Foundation. All rights reserved.',
  'Have a project in mind? Let''s build it together.',
  'Contact Us',
  '/contact',
  '[{"label":"Home","href":"/"},{"label":"About","href":"/about"},{"label":"Services","href":"/services"},{"label":"Projects","href":"/projects"},{"label":"Contact","href":"/contact"}]'::jsonb,
  '{}'::jsonb
);

insert into public.pages (slug, title, subtitle) values
  ('home','Home','Welcome to Surya Lok Kalyan Foundation'),
  ('about','About Us','Who we are and what we stand for'),
  ('services','Our Services','CSR, Solar and Property'),
  ('projects','Projects','Our impact in the community'),
  ('contact','Contact','Get in touch with us');

insert into public.services (slug, title, short_description, description, icon, benefits, sort_order) values
  ('csr','CSR Project Management','End-to-end CSR program design, execution and reporting.','We help corporates design, execute and report meaningful CSR initiatives in education, health, environment and rural development.','HeartHandshake','["Compliance ready (80G/12A/10AC)","Transparent reporting","On-ground execution teams","Impact measurement"]'::jsonb,1),
  ('solar','Solar Energy Solutions','Residential, agricultural and institutional solar installations.','Affordable, reliable solar systems for homes, farms and institutions — from rooftop solar to solar water pumps.','Sun','["Government subsidy assistance","Quality panels & inverters","Free site survey","After-sales service"]'::jsonb,2),
  ('property','Property Buy & Sell','Verified plots, farmhouses and commercial properties in Bihar.','Trusted property advisory in Patna and across Bihar — verified listings, legal due-diligence and end-to-end support.','Home','["Verified listings","Legal due diligence","Registration support","Local market expertise"]'::jsonb,3);

insert into public.seo_settings (page_path, title, description, keywords) values
  ('/','Surya Lok Kalyan Foundation | CSR, Solar & Property in Patna','NGO + business hybrid in Mithapur, Patna offering CSR project management, solar energy and property services.','SLKF, Surya Lok Kalyan Foundation, NGO Patna, CSR Bihar, solar Bihar, property Patna'),
  ('/about','About | Surya Lok Kalyan Foundation','Learn about SLKF — our mission, vision and team in Patna, Bihar.','SLKF about, NGO Patna, CSR organisation Bihar'),
  ('/services','Services | Surya Lok Kalyan Foundation','CSR project management, solar energy solutions and property buy/sell services.','CSR services, solar installation, property buy sell Bihar'),
  ('/projects','Projects | Surya Lok Kalyan Foundation','Selected CSR, solar and community projects delivered by SLKF.','SLKF projects, CSR impact, solar projects Bihar'),
  ('/contact','Contact | Surya Lok Kalyan Foundation','Call, WhatsApp or email Surya Lok Kalyan Foundation in Mithapur, Patna.','contact SLKF, Patna NGO contact');
