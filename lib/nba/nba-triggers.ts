import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createNba, closeNba } from './create-nba';

// Run all triggers. Idempotent — safe to call repeatedly.
export async function runNbaTriggers(): Promise<void> {
  await Promise.allSettled([
    triggerCheckoutsAbandonados(),
    triggerExpedientesNuevos(),
    triggerClienteSinRespuesta(),
    triggerTareasVencidas(),
    triggerHoldedDesconectado(),
    triggerWhatsappSinResponder(),
    triggerDocumentosSinClasificar(),
  ]);
}

async function triggerCheckoutsAbandonados() {
  const admin  = getSupabaseAdmin();
  const ago24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const { data: sessions } = await admin
    .from('checkout_sessions')
    .select('id, user_id, metadata, created_at')
    .neq('status', 'completed')
    .lt('created_at', ago24h)
    .limit(50);

  for (const s of sessions ?? []) {
    const serviceName = (s.metadata as Record<string, string>)?.service_name ?? 'servicio';
    await createNba({
      action_type: 'checkout_abandonado',
      priority:    'alta',
      title:       `Checkout abandonado: ${serviceName}`,
      description: `Sin pagar desde ${new Date(s.created_at as string).toLocaleDateString('es-ES')}`,
      client_id:   s.user_id ?? undefined,
      metadata:    { checkout_id: s.id, service_name: serviceName },
    });
  }
}

async function triggerExpedientesNuevos() {
  const admin = getSupabaseAdmin();
  const { data: cases } = await admin
    .from('cases')
    .select('id, client_id, service, service_id')
    .eq('status', 'nuevo')
    .limit(50);

  for (const c of cases ?? []) {
    await createNba({
      action_type: 'expediente_nuevo',
      priority:    'alta',
      title:       `Nuevo expediente: ${c.service ?? 'servicio'}`,
      case_id:     c.id,
      client_id:   c.client_id ?? undefined,
    });
  }
}

async function triggerClienteSinRespuesta() {
  const admin = getSupabaseAdmin();
  const ago3d = new Date(Date.now() - 3 * 86_400_000).toISOString();

  const { data: cases } = await admin
    .from('cases')
    .select('id, client_id, service')
    .eq('status', 'pendiente_cliente')
    .lt('updated_at', ago3d)
    .limit(50);

  for (const c of cases ?? []) {
    await createNba({
      action_type: 'cliente_sin_respuesta',
      priority:    'media',
      title:       `Cliente sin respuesta: ${c.service ?? 'expediente'}`,
      description: 'Más de 3 días en estado pendiente_cliente sin actividad',
      case_id:     c.id,
      client_id:   c.client_id ?? undefined,
    });
  }
}

async function triggerTareasVencidas() {
  const admin = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks } = await admin
    .from('internal_tasks')
    .select('id, title, case_id, client_id')
    .lt('due_date', today)
    .not('status', 'in', '("completada","cancelada")')
    .limit(50);

  for (const t of tasks ?? []) {
    await createNba({
      action_type: 'tarea_vencida',
      priority:    'alta',
      title:       `Tarea vencida: ${t.title}`,
      case_id:     t.case_id   ?? undefined,
      client_id:   t.client_id ?? undefined,
      metadata:    { task_id: t.id },
    });
  }
}

async function triggerHoldedDesconectado() {
  const admin = getSupabaseAdmin();

  // Find monthly-plan clients without active Holded
  const { data: clients } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('has_monthly_plan', true)
    .limit(100);

  for (const client of clients ?? []) {
    const { data: integration } = await admin
      .from('client_integrations')
      .select('id, status')
      .eq('client_id', client.id)
      .eq('provider', 'holded')
      .maybeSingle();

    if (!integration || integration.status === 'revoked') {
      await createNba({
        action_type: 'holded_desconectado',
        priority:    'alta',
        title:       `Sin Holded: ${client.full_name ?? client.id}`,
        description: 'Cliente con plan mensual activo sin integración Holded activa',
        client_id:   client.id,
      });
    } else {
      // Close if it was previously reported and is now fixed
      await closeNba({ action_type: 'holded_desconectado', client_id: client.id });
    }
  }
}

async function triggerWhatsappSinResponder() {
  const admin = getSupabaseAdmin();
  const ago2h = new Date(Date.now() - 2 * 3_600_000).toISOString();

  const { count } = await admin
    .from('whatsapp_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('direction', 'inbound')
    .eq('needs_review', true)
    .lt('created_at', ago2h);

  if ((count ?? 0) > 0) {
    await createNba({
      action_type: 'whatsapp_sin_responder',
      priority:    'media',
      title:       `${count} mensajes de WhatsApp sin responder (> 2h)`,
      metadata:    { count },
    });
  } else {
    // Close if resolved
    const { data: existing } = await getSupabaseAdmin()
      .from('next_best_actions')
      .select('id')
      .eq('action_type', 'whatsapp_sin_responder')
      .eq('status', 'open')
      .maybeSingle();
    if (existing) {
      await getSupabaseAdmin()
        .from('next_best_actions')
        .update({ status: 'done', resolved_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
  }
}

async function triggerDocumentosSinClasificar() {
  const admin = getSupabaseAdmin();
  const { count } = await admin
    .from('document_classifications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'needs_review');

  if ((count ?? 0) > 0) {
    await createNba({
      action_type: 'documento_sin_clasificar',
      priority:    'media',
      title:       `${count} documento${(count ?? 0) > 1 ? 's' : ''} pendiente${(count ?? 0) > 1 ? 's' : ''} de clasificar`,
      metadata:    { count },
    });
  }
}
