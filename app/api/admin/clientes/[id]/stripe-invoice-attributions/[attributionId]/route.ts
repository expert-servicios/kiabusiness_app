import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';

const revokeSchema = z.object({
  reason: z.string().trim().min(10).max(500),
});

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'inactive' || !isStaffRole(profile.role)) return null;
  return { admin, actorId: user.id };
}

async function audit(admin: AdminClient, actorId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
  const { error } = await admin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'stripe_invoice_attribution',
    entity_id: entityId,
    metadata,
  });
  if (error) console.error('[stripe-invoice-attribution] audit failed', error.message);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attributionId: string }> },
) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId, attributionId } = await params;
  const parsed = revokeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Motivo inválido' }, { status: 400 });

  const { data: attribution, error: attributionError } = await ctx.admin
    .from('stripe_invoice_company_attributions')
    .select('id,company_id,stripe_invoice_id,stripe_customer_id,status')
    .eq('id', attributionId)
    .maybeSingle();

  if (attributionError) return NextResponse.json({ error: 'No se pudo cargar la atribución' }, { status: 500 });
  if (!attribution) return NextResponse.json({ error: 'Atribución no encontrada' }, { status: 404 });
  if (attribution.status === 'revoked') return NextResponse.json({ ok: true, attribution, idempotent: true });

  const { data: membership } = await ctx.admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId)
    .eq('company_id', attribution.company_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'La atribución no pertenece a una empresa gestionada por este cliente' }, { status: 404 });
  }

  const revokedAt = new Date().toISOString();
  const { data: revoked, error: revokeError } = await ctx.admin
    .from('stripe_invoice_company_attributions')
    .update({
      status: 'revoked',
      revoked_by: ctx.actorId,
      revoked_at: revokedAt,
      revocation_reason: parsed.data.reason,
    })
    .eq('id', attributionId)
    .eq('status', 'active')
    .select('id,company_id,stripe_invoice_id,stripe_customer_id,status,revoked_by,revoked_at,revocation_reason')
    .maybeSingle();

  if (revokeError || !revoked) {
    return NextResponse.json({ error: 'La atribución cambió durante la revisión; vuelve a cargar antes de corregirla' }, { status: 409 });
  }

  await audit(ctx.admin, ctx.actorId, 'stripe_invoice_attribution.revoked', attributionId, {
    client_id: clientId,
    company_id: attribution.company_id,
    stripe_invoice_id: attribution.stripe_invoice_id,
    stripe_customer_id: attribution.stripe_customer_id,
    reason: parsed.data.reason,
  });

  return NextResponse.json({ ok: true, attribution: revoked });
}
