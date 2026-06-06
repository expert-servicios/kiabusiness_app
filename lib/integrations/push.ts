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

async function sendToSubscriptions(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth,user_id')
    .in('user_id', userIds);

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

  if (dead.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', dead);
  }
}

// Send push to all admin + owner users
export async function notifyAdmins(payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return;
  const admin = getSupabaseAdmin();

  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'owner']);

  if (!profiles?.length) return;

  await sendToSubscriptions(admin, profiles.map((p) => p.id as string), payload);
}

// Send push to a specific client user
export async function notifyClient(clientId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return;
  const admin = getSupabaseAdmin();
  await sendToSubscriptions(admin, [clientId], payload);
}
