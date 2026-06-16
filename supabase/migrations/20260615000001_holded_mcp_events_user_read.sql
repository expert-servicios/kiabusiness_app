-- Allow authenticated users to read their own MCP events via Realtime.
-- Matches by JWT email claim against user_email column.

CREATE POLICY "users can read own mcp events"
  ON public.holded_mcp_events
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' IS NOT NULL
    AND user_email = auth.jwt() ->> 'email'
  );
