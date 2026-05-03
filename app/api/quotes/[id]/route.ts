import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const quoteUpdateSchema = z
  .object({
    amount_eur: z.number().nonnegative().optional(),
    status: z.enum(['draft', 'sent', 'accepted', 'paid', 'expired']).optional(),
    expires_at: z.string().datetime().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar'
  });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const paramsData = await params;
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await sessionSupabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.session.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = quoteUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message ?? 'Datos de entrada inválidos' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (parseResult.data.amount_eur !== undefined) updates.amount_eur = parseResult.data.amount_eur;
    if (parseResult.data.status) updates.status = parseResult.data.status;
    if (parseResult.data.expires_at) updates.expires_at = parseResult.data.expires_at;

    const { data: updatedQuote, error: updateError } = await adminSupabase
      .from('quotes')
      .update(updates)
      .eq('id', paramsData.id)
      .select('id,title,amount_eur,status,expires_at,client_id')
      .single();

    if (updateError || !updatedQuote) {
      console.error('Quote update failed:', updateError);
      return NextResponse.json({ error: 'No se pudo actualizar el presupuesto' }, { status: 500 });
    }

    return NextResponse.json({ quote: updatedQuote });
  } catch (error) {
    console.error('Quote PATCH error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
