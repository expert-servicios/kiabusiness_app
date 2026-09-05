import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin onboarding follow-up', () => {
  const migration = source('supabase/migrations/20260905102800_subscription_onboarding_admin_followup.sql');
  const helper = source('lib/admin/onboarding-followup.ts');
  const calWebhook = source('app/api/webhooks/cal/route.ts');
  const completeRoute = source('app/api/dashboard/post-compra/complete/route.ts');
  const tasksApi = source('app/api/admin/tasks/route.ts');
  const tasksPage = source('app/(protected)/admin/tareas/page.tsx');
  const rightPanel = source('components/admin/AdminRightPanel.tsx');

  it('creates one open system onboarding task per client when subscription becomes active', () => {
    expect(migration).toContain('internal_tasks_one_open_subscription_onboarding_per_client');
    expect(migration).toContain("title = 'Completar alta tras suscripción'");
    expect(migration).toContain("status in ('pendiente','en_progreso')");
    expect(migration).toContain('after insert or update of status, post_purchase_onboarding_at');
    expect(migration).toContain("new.status not in ('active','trialing')");
    expect(migration).toContain('on conflict (client_id)');
  });

  it('completes the task and finalizes the onboarding case only after post-purchase onboarding is stored', () => {
    expect(migration).toContain('if new.post_purchase_onboarding_at is null then');
    expect(migration).toContain("set status = 'completada'");
    expect(migration).toContain("set state = 'finalizado'");
    expect(migration).toContain("status = 'finalizado'");
    expect(migration).toContain('closed_at = coalesce(closed_at, v_now)');
  });

  it('persists Cal bookings with all production NOT NULL appointment fields', () => {
    expect(calWebhook).toContain('phone,');
    expect(calWebhook).toContain("appointment_type: slug || 'cal_booking'");
    expect(calWebhook).toContain('appointment_date: payload.startTime');
    expect(calWebhook).toContain("{ onConflict: 'cal_uid' }");
  });

  it('reuses an open onboarding case and never writes the invalid cases.state nuevo value', () => {
    expect(calWebhook).toContain('findOpenOnboardingCase(authUser.id)');
    expect(helper).toContain(".in('service', ['Alta de usuario', 'Sesión de onboarding'])");
    expect(calWebhook).toContain("state: 'en_proceso'");
    expect(calWebhook).not.toContain("state: 'nuevo'");
  });

  it('creates idempotent admin booking alerts and syncs onboarding to the Admin calendar', () => {
    expect(calWebhook).toContain("eventType: 'onboarding.booking.admin'");
    expect(calWebhook).toContain('idempotencyKey: `cal/admin-booking/${payload.uid}`');
    expect(calWebhook).toContain('upsertCalendarEventSA({');
    expect(calWebhook).toContain('appointment.google_event_id ?? undefined');
    expect(calWebhook).toContain('deleteCalendarEventSA(appointment.google_event_id)');
  });

  it('notifies Admin once when onboarding is completed while the DB trigger closes operational work', () => {
    expect(completeRoute).toContain("eventType: 'onboarding.completed.admin'");
    expect(completeRoute).toContain('idempotencyKey: `onboarding/completed/admin/${subscription.id}`');
    expect(completeRoute).toContain('notifyAdmins({');
    expect(completeRoute).toContain(".update({ post_purchase_onboarding_at: completedAt })");
  });

  it('exposes internal tasks as an authenticated staff workspace and in the Admin alerts panel', () => {
    expect(tasksApi).toContain('isStaffRole(profile?.role)');
    expect(tasksApi).toContain(".from('internal_tasks')");
    expect(tasksApi).toContain("source: 'manual'");
    expect(tasksPage).toContain('Tareas pendientes');
    expect(tasksPage).toContain("fetch('/api/admin/tasks'");
    expect(rightPanel).toContain('href="/admin/tareas"');
    expect(rightPanel).toContain('Tareas abiertas');
  });
});
