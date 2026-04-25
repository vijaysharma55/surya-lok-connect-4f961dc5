-- Prevent duplicate active applications by mobile or aadhaar
CREATE UNIQUE INDEX IF NOT EXISTS applications_unique_active_mobile
  ON public.applications (mobile)
  WHERE status IN ('pending','approved','verified','active');

CREATE UNIQUE INDEX IF NOT EXISTS applications_unique_active_aadhaar
  ON public.applications (aadhaar)
  WHERE status IN ('pending','approved','verified','active');