-- 1. Add ownership column to applications & memberships
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS claimed_by uuid;
ALTER TABLE public.memberships  ADD COLUMN IF NOT EXISTS claimed_by uuid;
ALTER TABLE public.memberships  ADD COLUMN IF NOT EXISTS application_code text;

CREATE INDEX IF NOT EXISTS applications_claimed_by_idx ON public.applications(claimed_by);
CREATE INDEX IF NOT EXISTS memberships_claimed_by_idx  ON public.memberships(claimed_by);
CREATE INDEX IF NOT EXISTS applications_email_lower_idx ON public.applications(lower(email));
CREATE INDEX IF NOT EXISTS memberships_email_lower_idx  ON public.memberships(lower(email));

-- 2. Trigger function: when a new auth.user is created, claim matching rows
CREATE OR REPLACE FUNCTION public.claim_records_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.applications
       SET claimed_by = NEW.id
     WHERE claimed_by IS NULL
       AND email IS NOT NULL
       AND lower(email) = lower(NEW.email);

    UPDATE public.memberships
       SET claimed_by = NEW.id
     WHERE claimed_by IS NULL
       AND email IS NOT NULL
       AND lower(email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_claim_records_for_new_user ON auth.users;
CREATE TRIGGER trg_claim_records_for_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.claim_records_for_new_user();

-- 3. Trigger function: when an application/membership is created with an email
--    that already belongs to a registered user, auto-claim it.
CREATE OR REPLACE FUNCTION public.claim_application_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE u uuid;
BEGIN
  IF NEW.email IS NOT NULL AND NEW.claimed_by IS NULL THEN
    SELECT id INTO u FROM auth.users WHERE lower(email) = lower(NEW.email) LIMIT 1;
    IF u IS NOT NULL THEN NEW.claimed_by := u; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_claim_application_on_insert ON public.applications;
CREATE TRIGGER trg_claim_application_on_insert
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.claim_application_on_insert();

DROP TRIGGER IF EXISTS trg_claim_membership_on_insert ON public.memberships;
CREATE TRIGGER trg_claim_membership_on_insert
  BEFORE INSERT ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.claim_application_on_insert();

-- 4. RLS: owners can read/update their own claimed records
CREATE POLICY "Owners view own applications"
  ON public.applications FOR SELECT TO authenticated
  USING (claimed_by = auth.uid());

CREATE POLICY "Owners view own memberships"
  ON public.memberships FOR SELECT TO authenticated
  USING (claimed_by = auth.uid());