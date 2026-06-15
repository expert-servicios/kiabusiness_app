-- Allow authenticated users to SELECT their own MCP events.
-- Required for Supabase Realtime postgres_changes subscriptions in the
-- post-purchase Claude wizard (PostCompraWizard.tsx).
-- The existing "mcp_events_deny_anon" policy blocks all access including
-- authenticated users; this additive policy opens read-only access scoped
-- to rows where user_email matches the JWT claim.

CREATE POLICY "users can read own mcp events"
  ON public.holded_mcp_events
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' IS NOT NULL
    AND user_email = auth.jwt() ->> 'email'
  );
