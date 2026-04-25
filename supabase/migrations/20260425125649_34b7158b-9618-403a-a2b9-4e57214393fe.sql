-- ============ ENUM ============
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending','verified','active','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ LOCATION TABLES ============
CREATE TABLE IF NOT EXISTS public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district_id uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, district_id)
);

CREATE TABLE IF NOT EXISTS public.panchayats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, block_id)
);

-- ============ ROLES (dynamic) ============
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  level text NOT NULL DEFAULT 'global',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ USERS (single source of truth) ============
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  name text NOT NULL,
  mobile text NOT NULL,
  aadhaar text,
  email text,
  role_id uuid REFERENCES public.roles(id),
  district_id uuid REFERENCES public.districts(id),
  block_id uuid REFERENCES public.blocks(id),
  panchayat_id uuid REFERENCES public.panchayats(id),
  status public.verification_status NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  amount_paid numeric NOT NULL DEFAULT 0,
  expected_amount numeric NOT NULL DEFAULT 101,
  transaction_id text,
  photo_url text,
  aadhaar_image_url text,
  payment_screenshot_url text,
  application_code text UNIQUE DEFAULT public.gen_application_code(),
  admin_notes text,
  processed_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_mobile_unique UNIQUE (mobile),
  CONSTRAINT users_aadhaar_unique UNIQUE (aadhaar),
  CONSTRAINT users_name_len CHECK (char_length(name) BETWEEN 2 AND 120),
  CONSTRAINT users_mobile_len CHECK (char_length(mobile) BETWEEN 7 AND 20),
  CONSTRAINT users_email_len CHECK (email IS NULL OR char_length(email) <= 254)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_active_idx
  ON public.users (mobile)
  WHERE status IN ('pending','verified','active');

CREATE INDEX IF NOT EXISTS users_district_idx ON public.users(district_id);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role_id);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at DESC);

-- ============ TRIGGERS ============
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_districts_updated_at ON public.districts;
CREATE TRIGGER trg_districts_updated_at
  BEFORE UPDATE ON public.districts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_blocks_updated_at ON public.blocks;
CREATE TRIGGER trg_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_panchayats_updated_at ON public.panchayats;
CREATE TRIGGER trg_panchayats_updated_at
  BEFORE UPDATE ON public.panchayats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_approved_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('verified','active') AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.approved_at = COALESCE(NEW.approved_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_approved_at ON public.users;
CREATE TRIGGER trg_users_approved_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_approved_at();

-- ============ BACKFILL FROM locations ============
INSERT INTO public.districts (name, sort_order)
SELECT name, sort_order FROM public.locations WHERE type = 'district'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.blocks (name, district_id, sort_order)
SELECT l.name, d.id, l.sort_order
FROM public.locations l
JOIN public.locations p ON p.id = l.parent_id AND p.type = 'district'
JOIN public.districts d ON d.name = p.name
WHERE l.type = 'block'
ON CONFLICT (name, district_id) DO NOTHING;

INSERT INTO public.panchayats (name, block_id, sort_order)
SELECT l.name, b.id, l.sort_order
FROM public.locations l
JOIN public.locations pb ON pb.id = l.parent_id AND pb.type = 'block'
JOIN public.locations pd ON pd.id = pb.parent_id AND pd.type = 'district'
JOIN public.districts d ON d.name = pd.name
JOIN public.blocks b ON b.name = pb.name AND b.district_id = d.id
WHERE l.type = 'panchayat'
ON CONFLICT (name, block_id) DO NOTHING;

-- ============ SEED ROLES from roles_catalog ============
INSERT INTO public.roles (name, label, level, active, sort_order)
SELECT key, label, 'global', active, sort_order
FROM public.roles_catalog
ON CONFLICT (name) DO NOTHING;

-- Ensure baseline roles exist
INSERT INTO public.roles (name, label, level, sort_order) VALUES
  ('member','Member','global',10),
  ('volunteer','Volunteer','global',20),
  ('panchayat_coordinator','Panchayat Coordinator','panchayat',30),
  ('block_coordinator','Block Coordinator','block',40),
  ('district_coordinator','District Coordinator','district',50)
ON CONFLICT (name) DO NOTHING;

-- ============ RATE LIMITS ============
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- ============ RLS ============
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panchayats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Public reads for reference data
CREATE POLICY "Public reads districts" ON public.districts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage districts" ON public.districts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public reads blocks" ON public.blocks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage blocks" ON public.blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public reads panchayats" ON public.panchayats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage panchayats" ON public.panchayats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public reads roles" ON public.roles FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Users table RLS (uses existing has_role + is_coordinator_for_district by district name)
CREATE POLICY "Public submits user application"
  ON public.users FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 2 AND 120
    AND char_length(mobile) BETWEEN 7 AND 20
    AND status = 'pending'
    AND payment_status = 'pending'
  );

CREATE POLICY "Admins full access users"
  ON public.users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users view own record"
  ON public.users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Coordinators view district users"
  ON public.users FOR SELECT TO authenticated
  USING (
    district_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.districts d
      WHERE d.id = users.district_id
        AND public.is_coordinator_for_district(auth.uid(), d.name)
    )
  );

CREATE POLICY "Coordinators update district users"
  ON public.users FOR UPDATE TO authenticated
  USING (
    district_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.districts d
      WHERE d.id = users.district_id
        AND public.is_coordinator_for_district(auth.uid(), d.name)
    )
  )
  WITH CHECK (
    district_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.districts d
      WHERE d.id = users.district_id
        AND public.is_coordinator_for_district(auth.uid(), d.name)
    )
  );

-- Rate limits: admin only
CREATE POLICY "Admins manage rate_limits" ON public.rate_limits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PUBLIC STATUS RPC ============
CREATE OR REPLACE FUNCTION public.public_get_status(p_mobile text)
RETURNS TABLE (
  application_code text,
  name text,
  status public.verification_status,
  district_name text,
  role_label text,
  created_at timestamptz,
  approved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.application_code, u.name, u.status,
         d.name AS district_name,
         r.label AS role_label,
         u.created_at, u.approved_at
  FROM public.users u
  LEFT JOIN public.districts d ON d.id = u.district_id
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.mobile = p_mobile
  ORDER BY u.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.public_get_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_get_status(text) TO anon, authenticated;