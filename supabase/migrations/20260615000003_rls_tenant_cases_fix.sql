-- Fix RLS policy for tenant_admin on cases table.
-- Uses is_tenant_admin() + auth_tenant_id() helpers from tenant_ready migration.

DROP POLICY IF EXISTS "tenant_admin select cases" ON public.cases;
CREATE POLICY "tenant_admin select cases" ON public.cases
  FOR SELECT USING (
    is_tenant_admin()
    AND client_id IN (
      SELECT id FROM public.profiles
      WHERE tenant_id = auth_tenant_id()
    )
  );
