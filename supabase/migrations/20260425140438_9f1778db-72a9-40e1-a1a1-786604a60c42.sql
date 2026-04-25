-- 1) Verify-by-id-or-code (safe public projection)
CREATE OR REPLACE FUNCTION public.public_verify_id(p_id text)
RETURNS TABLE(
  application_code text,
  full_name text,
  post text,
  district text,
  status text,
  photo_url text,
  approved_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid uuid;
BEGIN
  IF p_id IS NULL OR length(p_id) < 4 OR length(p_id) > 80 THEN
    RETURN;
  END IF;

  -- Try UUID first
  BEGIN
    v_uuid := p_id::uuid;
  EXCEPTION WHEN others THEN
    v_uuid := NULL;
  END;

  IF v_uuid IS NOT NULL THEN
    RETURN QUERY
      SELECT a.application_code, a.full_name, a.post, a.district,
             a.status, a.photo_url, a.approved_at
      FROM public.applications a
      WHERE a.id = v_uuid
      LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  RETURN QUERY
    SELECT a.application_code, a.full_name, a.post, a.district,
           a.status, a.photo_url, a.approved_at
    FROM public.applications a
    WHERE a.application_code = p_id
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.public_verify_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_verify_id(text) TO anon, authenticated;

-- 2) Rate limiter (per key, sliding 1-minute window)
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_max int DEFAULT 30)
RETURNS TABLE(allowed boolean, hits int, retry_after_seconds int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window timestamptz := v_now - interval '1 minute';
  v_row public.rate_limits%ROWTYPE;
BEGIN
  IF p_key IS NULL OR length(p_key) = 0 THEN
    RETURN QUERY SELECT true, 0, 0; RETURN;
  END IF;

  SELECT * INTO v_row FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits(key, hits, window_start)
    VALUES (p_key, 1, v_now);
    RETURN QUERY SELECT true, 1, 0; RETURN;
  END IF;

  IF v_row.window_start < v_window THEN
    UPDATE public.rate_limits
       SET hits = 1, window_start = v_now
     WHERE key = p_key;
    RETURN QUERY SELECT true, 1, 0; RETURN;
  END IF;

  IF v_row.hits >= p_max THEN
    RETURN QUERY SELECT false, v_row.hits,
      GREATEST(1, 60 - EXTRACT(EPOCH FROM (v_now - v_row.window_start))::int);
    RETURN;
  END IF;

  UPDATE public.rate_limits SET hits = hits + 1 WHERE key = p_key;
  RETURN QUERY SELECT true, v_row.hits + 1, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, int) TO anon, authenticated;

-- 3) Track first ID-card download for confetti
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS id_card_downloaded_at timestamptz;

-- 4) Owner can mark their card as downloaded (uses existing owner-update? no, only admins update -> add owner update policy bound to that column path via a new policy)
DROP POLICY IF EXISTS "Owners mark id_card_downloaded" ON public.applications;
CREATE POLICY "Owners mark id_card_downloaded"
ON public.applications
FOR UPDATE TO authenticated
USING (claimed_by = auth.uid())
WITH CHECK (claimed_by = auth.uid());

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_applications_application_code ON public.applications (application_code);
CREATE INDEX IF NOT EXISTS idx_applications_claimed_by ON public.applications (claimed_by);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits (key);