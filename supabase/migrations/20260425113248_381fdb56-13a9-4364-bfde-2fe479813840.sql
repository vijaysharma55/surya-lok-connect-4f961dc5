CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone_number text NOT NULL,
  address text,
  membership_type text NOT NULL DEFAULT 'Basic',
  payment_status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public submits bounded membership"
  ON public.memberships FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(phone_number) BETWEEN 7 AND 20
    AND (email IS NULL OR char_length(email) <= 254)
    AND (address IS NULL OR char_length(address) <= 500)
    AND char_length(membership_type) BETWEEN 1 AND 40
    AND payment_status = 'pending'
  );

CREATE POLICY "Admins read memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update memberships"
  ON public.memberships FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete memberships"
  ON public.memberships FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER memberships_set_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.memberships REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;