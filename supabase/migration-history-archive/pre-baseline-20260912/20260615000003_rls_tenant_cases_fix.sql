-- Fix tenant_admin SELECT policy on cases to scope by client_id rather than
-- cases.tenant_id. The cases.tenant_id column is nullable (legacy records have NULL)
-- so the previous policy silently excluded all legacy cases. Scoping via client_id
-- matches how the tenant portal pages actually query cases and is consistent with
-- the existing tenant_admin policy on documents.

DROP POLICY IF EXISTS "tenant_admin select cases" ON public.cases;
CREATE POLICY "tenant_admin select cases" ON public.cases
  FOR SELECT USING (
    is_tenant_admin()
    AND client_id IN (
      SELECT id FROM public.profiles
      WHERE tenant_id = auth_tenant_id()
    )
  );
