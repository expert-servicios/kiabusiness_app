import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// holded_mcp_connections only receives UPDATEs from connector-event (never an INSERT from this
// app — the MCP server owns the initial row creation). We therefore detect connection via
// holded_mcp_events (which always gets an INSERT on user_connected / first_activity).
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Primary: check holded_mcp_connections (populated by the MCP server's own auth flow)
  const { data: conn } = await admin
    .from('holded_mcp_connections')
    .select('id, status, last_activity_at, created_at')
    .eq('supabase_user_id', user.id)
    .eq('channel', 'claude')
    .eq('status', 'connected')
    .maybeSingle();

  if (conn) {
    return NextResponse.json({
      connected  : true,
      lastActivity: conn.last_activity_at ?? null,
      connectedAt : conn.created_at ?? null,
      source      : 'connections',
    });
  }

  // Fallback: check holded_mcp_events for a user_connected or first_activity event.
  // This catches the case where the MCP server hasn't yet written a holded_mcp_connections row
  // (which requires the MCP server to call its own registration endpoint).
  const { data: event } = await admin
    .from('holded_mcp_events')
    .select('id, event_type, detected_at')
    .eq('user_email', user.email)
    .in('event_type', ['user_connected', 'first_activity'])
    .eq('channel', 'claude')
    .order('detected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    connected   : !!event,
    lastActivity: event?.detected_at ?? null,
    connectedAt : event?.detected_at ?? null,
    source      : event ? 'events' : 'none',
  });
}
