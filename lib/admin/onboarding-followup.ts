import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export const ONBOARDING_TASK_TITLE = 'Completar alta tras suscripción';

function addDaysIsoDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? 'info@expertconsulting.es')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function ensureOnboardingTask(input: {
  clientId: string;
  caseId?: string | null;
  description: string;
  dueDate?: string | null;
  priority?: 'baja' | 'media' | 'alta' | 'critica';
  status?: 'pendiente' | 'en_progreso';
}) {
  const admin = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await admin
    .from('internal_tasks')
    .select('id,status')
    .eq('client_id', input.clientId)
    .eq('source', 'system')
    .eq('title', ONBOARDING_TASK_TITLE)
    .in('status', ['pendiente', 'en_progreso'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(`Could not inspect onboarding task: ${lookupError.message}`);

  const payload = {
    description: input.description,
    due_date: input.dueDate ?? addDaysIsoDate(2),
    priority: input.priority ?? 'alta',
    case_id: input.caseId ?? null,
    status: input.status ?? existing?.status ?? 'pendiente',
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await admin.from('internal_tasks').update(payload).eq('id', existing.id);
    if (error) throw new Error(`Could not update onboarding task: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await admin
    .from('internal_tasks')
    .insert({
      title: ONBOARDING_TASK_TITLE,
      client_id: input.clientId,
      case_id: input.caseId ?? null,
      description: input.description,
      status: input.status ?? 'pendiente',
      priority: input.priority ?? 'alta',
      due_date: input.dueDate ?? addDaysIsoDate(2),
      source: 'system',
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Could not create onboarding task: ${error?.message ?? 'unknown error'}`);
  return data.id;
}

export async function completeOnboardingTask(clientId: string) {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('internal_tasks')
    .update({ status: 'completada', completed_at: now, updated_at: now })
    .eq('client_id', clientId)
    .eq('source', 'system')
    .eq('title', ONBOARDING_TASK_TITLE)
    .in('status', ['pendiente', 'en_progreso']);
  if (error) throw new Error(`Could not complete onboarding task: ${error.message}`);
}

export async function findOpenOnboardingCase(clientId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('cases')
    .select('id,service,state,status')
    .eq('client_id', clientId)
    .in('service', ['Alta de usuario', 'Sesión de onboarding'])
    .neq('state', 'finalizado')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not resolve onboarding case: ${error.message}`);
  return data ?? null;
}
