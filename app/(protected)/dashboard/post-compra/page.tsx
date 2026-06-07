import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import PostCompraWizard from '@/components/dashboard/PostCompraWizard';

const MCP_LAUNCH_URL = process.env.NEXT_PUBLIC_MCP_LAUNCH_URL ?? 'https://claude.expertconsulting.es/launch';

interface SubscriptionRecord {
  id                         : string;
  plan_name                  : string;
  status                     : string;
  post_purchase_onboarding_at: string | null;
}

interface HoldedStatus { connected: boolean }
interface McpStatus    { connected: boolean }

async function fetchWithCookies(path: string) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl(path), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PostCompraPage() {
  const [subsData, holdedData, mcpData] = await Promise.all([
    fetchWithCookies('/api/subscriptions'),
    fetchWithCookies('/api/integrations/holded/status'),
    fetchWithCookies('/api/integrations/holded/mcp-status'),
  ]);

  const subscriptions: SubscriptionRecord[] = subsData?.subscriptions ?? [];

  // Find the most recent active subscription that hasn't completed post-purchase onboarding
  const pendingSub = subscriptions.find(
    (s) => (s.status === 'active' || s.status === 'trialing') && !s.post_purchase_onboarding_at
  );

  // If no active subscription pending onboarding → go to dashboard
  if (!pendingSub) redirect('/dashboard');

  const holdedConnected = !!(holdedData as HoldedStatus | null)?.connected;
  const claudeConnected = !!(mcpData    as McpStatus    | null)?.connected;

  return (
    <PostCompraWizard
      planName={pendingSub.plan_name}
      holdedConnected={holdedConnected}
      claudeConnected={claudeConnected}
      mcpLaunchUrl={MCP_LAUNCH_URL}
    />
  );
}
