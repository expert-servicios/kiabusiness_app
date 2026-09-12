-- RLS policies for review_requests (token-based access, no auth required for anonymous submission)
-- Clients reach this table only via service_role from the API — no direct authenticated access needed.

-- Admin can manage all review_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'review_requests'
      AND policyname = 'admin all review_requests'
  ) THEN
    CREATE POLICY "admin all review_requests" ON public.review_requests
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Add service_name to reviews so admin panel can display it without joining cases
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS service_name text;
