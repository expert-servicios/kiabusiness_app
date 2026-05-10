import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { syncQuoteToHolded } from '@/lib/integrations/holded';

const schema = z.object({
  quoteId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 });
    }

    const { quoteId } = parsed.data;
    const { data: quote, error: quoteError } = await admin
      .from('quotes')
      .select('id,title,description,amount_eur,client_id,lead_id')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    const { data: lead } = await admin
      .from('leads')
      .select('name,email,phone,service,category')
      .eq('id', quote.lead_id)
      .maybeSingle();

    let clientEmail = lead?.email ?? '';
    let clientName = lead?.name ?? clientEmail.split('@')[0] ?? 'Cliente';
    let clientPhone = lead?.phone ?? null;

    if (quote.client_id) {
      const [authUser, profile] = await Promise.all([
        admin.auth.admin.getUserById(quote.client_id),
        admin.from('profiles').select('full_name,phone').eq('id', quote.client_id).maybeSingle()
      ]);
      clientEmail = authUser.data.user?.email ?? clientEmail;
      clientName = profile.data?.full_name ?? clientName;
      clientPhone = profile.data?.phone ?? clientPhone;
    }

    if (!clientEmail) {
      return NextResponse.json({ error: 'El presupuesto no tiene email de cliente' }, { status: 400 });
    }

    const result = await syncQuoteToHolded({
      quoteId: quote.id,
      clientName,
      clientEmail,
      clientPhone,
      description: quote.title ?? quote.description,
      amountEur: Number(quote.amount_eur),
      localEntity: 'quotes'
    });

    return NextResponse.json({ ok: !result.error, result });
  } catch (error) {
    console.error('[admin/integrations/holded/sync-quote] error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
