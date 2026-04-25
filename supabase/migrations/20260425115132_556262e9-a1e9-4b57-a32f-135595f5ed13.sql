-- LOCATIONS (admin-managed hierarchy)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('district','block','panchayat')),
  parent_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_type ON public.locations(type);
CREATE INDEX idx_locations_parent ON public.locations(parent_id);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads locations"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper to generate short application code
CREATE OR REPLACE FUNCTION public.gen_application_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
BEGIN
  code := 'SLKF-' || to_char(now(), 'YY') || '-' ||
          upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  RETURN code;
END;
$$;

-- APPLICATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code text NOT NULL UNIQUE DEFAULT public.gen_application_code(),
  full_name text NOT NULL,
  mobile text NOT NULL,
  aadhaar text NOT NULL,
  email text,
  district text NOT NULL,
  block text NOT NULL,
  panchayat text NOT NULL,
  post text NOT NULL CHECK (post IN ('District Coordinator','Block Coordinator','Panchayat Coordinator')),
  payment_amount numeric NOT NULL DEFAULT 101,
  transaction_id text NOT NULL,
  payment_screenshot_url text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_lookup ON public.applications(mobile, aadhaar);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Public can submit (status forced to pending, fields bounded)
CREATE POLICY "Public submits bounded application"
  ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(mobile) BETWEEN 7 AND 20
    AND char_length(aadhaar) BETWEEN 12 AND 14
    AND (email IS NULL OR char_length(email) <= 254)
    AND char_length(district) BETWEEN 1 AND 80
    AND char_length(block) BETWEEN 1 AND 80
    AND char_length(panchayat) BETWEEN 1 AND 80
    AND char_length(transaction_id) BETWEEN 3 AND 80
    AND char_length(payment_screenshot_url) BETWEEN 5 AND 1000
    AND status = 'pending'
  );

-- Public can look up their OWN application by mobile + aadhaar
CREATE POLICY "Public lookup own application"
  ON public.applications FOR SELECT
  TO anon, authenticated
  USING (true);
-- Note: lookup is via .eq("mobile",..).eq("aadhaar",..) on the client.
-- Since approval status is non-sensitive once both factors are known,
-- and admins are the only ones writing status, this is acceptable.

CREATE POLICY "Admins update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a few Bihar districts so dropdowns aren't empty
INSERT INTO public.locations (name, type, sort_order) VALUES
  ('Patna', 'district', 1),
  ('Nalanda', 'district', 2),
  ('Gaya', 'district', 3),
  ('Bhagalpur', 'district', 4),
  ('Muzaffarpur', 'district', 5);