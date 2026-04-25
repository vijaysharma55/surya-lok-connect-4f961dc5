CREATE OR REPLACE FUNCTION public.gen_application_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code text;
BEGIN
  code := 'SLKF-' || to_char(now(), 'YY') || '-' ||
          upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  RETURN code;
END;
$$;