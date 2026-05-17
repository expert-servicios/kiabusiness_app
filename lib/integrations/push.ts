import webpush from 'web-push';
import { getSupabaseAdmin } from './supabase';

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
}

let vapidReady = false;
function ensureVapid(): boolean {
  if (vapidReady) return true;
  const subject    = process.env.VAPID_SUBJECT;
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

// Send push to all admin users
export async function notifyAdmins(payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return; // env vars not set — skip silently
  const admin = getSupabaseAdmin();

  // Get all admin user IDs
  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (!profiles?.length) return;

  const adminIds = profiles.map((p) => p.id as string);

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth,user_id')
    .in('user_id', adminIds);

  if (!subs?.length) return;

  const dead: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(sub.endpoint);
      }
    })
  );

  // Remove expired subscriptions
  if (dead.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', dead);
  }
}
