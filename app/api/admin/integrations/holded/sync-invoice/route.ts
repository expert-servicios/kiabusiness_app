import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { syncOrderToHolded } from '@/lib/integrations/holded';

const schema = z.object({
  orderId: z.string().uuid()
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 });
    }

    const { orderId } = parsed.data;
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id,quote_id,client_id,amount_eur,currency,stripe_payment_id,metadata')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { data: quote } = await admin
      .from('quotes')
      .select('title,description,lead_id')
      .eq('id', order.quote_id)
      .maybeSingle();

    const { data: lead } = quote?.lead_id
      ? await admin.from('leads').select('name,email,phone').eq('id', quote.lead_id).maybeSingle()
      : { data: null };

    let clientEmail = lead?.email ?? '';
    let clientName = lead?.name ?? clientEmail.split('@')[0] ?? 'Cliente';
    let clientPhone = lead?.phone ?? null;

    if (order.client_id) {
      const [authUser, profile] = await Promise.all([
        admin.auth.admin.getUserById(order.client_id),
        admin.from('profiles').select('full_name,phone').eq('id', order.client_id).maybeSingle()
      ]);
      clientEmail = authUser.data.user?.email ?? clientEmail;
      clientName = profile.data?.full_name ?? clientName;
      clientPhone = profile.data?.phone ?? clientPhone;
    }

    if (!clientEmail) {
      return NextResponse.json({ error: 'El pedido no tiene email de cliente' }, { status: 400 });
    }

    const result = await syncOrderToHolded({
      orderId: order.id,
      clientName,
      clientEmail,
      clientPhone,
      description: quote?.title ?? quote?.description ?? 'Servicio EXPERT',
      amountEur: Number(order.amount_eur),
      localEntity: 'orders',
      source: 'manual'
    });

    if (result.invoiceId) {
      await admin
        .from('orders')
        .update({
          metadata: {
            ...asRecord(order.metadata),
            holded: {
              contact_id: result.contactId,
              invoice_id: result.invoiceId,
              sync_event_id: result.syncEventId,
              source: 'manual'
            }
          }
        })
        .eq('id', order.id);
    }

    return NextResponse.json({ ok: !result.error, result });
  } catch (error) {
    console.error('[admin/integrations/holded/sync-invoice] error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
