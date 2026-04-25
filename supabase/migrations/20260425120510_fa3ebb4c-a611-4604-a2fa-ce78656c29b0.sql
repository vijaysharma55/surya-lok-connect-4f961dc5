
CREATE TABLE IF NOT EXISTS public.roles_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  level int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roles_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads roles_catalog" ON public.roles_catalog FOR SELECT USING (true);
CREATE POLICY "Admins manage roles_catalog" ON public.roles_catalog FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.roles_catalog (key, label, level, sort_order) VALUES
  ('member','Member',10,10),
  ('volunteer','Volunteer',20,20),
  ('panchayat_coordinator','Panchayat Coordinator',30,30),
  ('block_coordinator','Block Coordinator',40,40),
  ('district_coordinator','District Coordinator',50,50)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.coordinator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  district text NOT NULL,
  block text,
  panchayat text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_coord_assignment
  ON public.coordinator_assignments (user_id, district, COALESCE(block,''), COALESCE(panchayat,''));
ALTER TABLE public.coordinator_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coordinator_assignments" ON public.coordinator_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own assignments" ON public.coordinator_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_coordinator_for_district(_user_id uuid, _district text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coordinator_assignments
    WHERE user_id = _user_id AND district = _district
  );
$$;

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS expected_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aadhaar text,
  ADD COLUMN IF NOT EXISTS district text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS aadhaar_image_url text,
  ADD COLUMN IF NOT EXISTS expected_amount numeric NOT NULL DEFAULT 101,
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Coordinators read district applications" ON public.applications;
CREATE POLICY "Coordinators read district applications" ON public.applications FOR SELECT TO authenticated
  USING (public.is_coordinator_for_district(auth.uid(), district));

DROP POLICY IF EXISTS "Coordinators update district applications" ON public.applications;
CREATE POLICY "Coordinators update district applications" ON public.applications FOR UPDATE TO authenticated
  USING (public.is_coordinator_for_district(auth.uid(), district));

DROP POLICY IF EXISTS "Coordinators read district memberships" ON public.memberships;
CREATE POLICY "Coordinators read district memberships" ON public.memberships FOR SELECT TO authenticated
  USING (district IS NOT NULL AND public.is_coordinator_for_district(auth.uid(), district));

DROP POLICY IF EXISTS "Coordinators update district memberships" ON public.memberships;
CREATE POLICY "Coordinators update district memberships" ON public.memberships FOR UPDATE TO authenticated
  USING (district IS NOT NULL AND public.is_coordinator_for_district(auth.uid(), district));

CREATE INDEX IF NOT EXISTS idx_applications_district ON public.applications(district);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_mobile ON public.applications(mobile);
CREATE INDEX IF NOT EXISTS idx_applications_aadhaar ON public.applications(aadhaar);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_phone ON public.memberships(phone_number);
CREATE INDEX IF NOT EXISTS idx_coord_user ON public.coordinator_assignments(user_id);
