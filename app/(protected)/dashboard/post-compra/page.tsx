import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import PostCompraWizard  from '@/components/dashboard/PostCompraWizard';
import PostCompraWaiting from '@/components/dashboard/PostCompraWaiting';

const MCP_BASE = process.env.NEXT_PUBLIC_HOLDED_MCP_BASE_URL ?? 'https://claude.expertconsulting.es';
const MCP_LAUNCH_URL = `${MCP_BASE}/launch`;

interface SubscriptionRecord {
  id                         : string;
  plan_name                  : string;
  status                     : string;
  post_purchase_onboarding_at: string | null;
}

interface McpStatus { connected: boolean }

export default async function PostCompraPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const [subsData, mcpData] = await Promise.all([
    fetchWithCookies('/api/subscriptions'),
    fetchWithCookies('/api/integrations/holded/mcp-status'),
  ]);

  const subscriptions: SubscriptionRecord[] = subsData?.subscriptions ?? [];

  // Find the most recent active subscription that hasn't completed post-purchase onboarding
  const pendingSub = subscriptions.find(
    (s) => (s.status === 'active' || s.status === 'trialing') && !s.post_purchase_onboarding_at
  );

  // No active subscription at all (not just pending onboarding) → redirect to plans page
  const hasActiveSub = subscriptions.some(
    (s) => s.status === 'active' || s.status === 'trialing'
  );
  if (hasActiveSub && !pendingSub) {
    // Onboarding already completed — go to dashboard
    redirect('/dashboard');
  }
  if (!hasActiveSub) {
    // No subscription yet — could be a Stripe webhook race. Show a waiting screen
    // that polls via router.refresh() every 3s for up to 30s.
    return <PostCompraWaiting />;
  }

  // holdedConnected is structurally guaranteed true: the subscription checkout route
  // returns 409 'holded_required' if no active Holded integration exists, so a
  // subscription row can only be created after Holded is connected.
  const claudeConnected = !!(mcpData as McpStatus | null)?.connected;

  return (
    <PostCompraWizard
      planName={pendingSub!.plan_name}
      holdedConnected={true}
      claudeConnected={claudeConnected}
      mcpLaunchUrl={MCP_LAUNCH_URL}
      userEmail={user?.email ?? ''}
    />
  );
}
