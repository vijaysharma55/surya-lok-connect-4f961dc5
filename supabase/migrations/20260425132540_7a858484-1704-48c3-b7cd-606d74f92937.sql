ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.coordinator_assignments REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinator_assignments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;