import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getAcademyProgram } from '@/lib/data/academy-catalog';
import { requireAdminClient } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const [{ data: enrollments, error: enrollError }, { data: unlinkedOrders, error: ordersError }] = await Promise.all([
    admin
      .from('academy_enrollments')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(300),
    admin
      .from('orders')
      .select('id, amount_eur, currency, stripe_payment_id, service_slugs, metadata, created_at')
      .eq('source', 'academy')
      .is('client_id', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (enrollError) return NextResponse.json({ error: enrollError.message }, { status: 500 });
  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

  return NextResponse.json({ enrollments: enrollments ?? [], unlinkedOrders: unlinkedOrders ?? [] });
}

const createSchema = z.object({
  email: z.string().email(),
  program_slug: z.string().min(1),
  amount_eur: z.number().positive(),
  admin_note: z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { email, program_slug, amount_eur, admin_note } = parsed.data;

  const program = getAcademyProgram(program_slug);
  if (!program) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 400 });

  const { data: matchedProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!matchedProfile) {
    return NextResponse.json({ error: 'No existe ninguna cuenta EXPERT con ese email.' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('academy_enrollments')
    .insert({
      client_id: matchedProfile.id,
      program_slug: program.slug,
      program_name: program.name,
      amount_eur,
      stripe_payment_id: `manual-${randomUUID()}`,
      status: 'active',
      admin_note: admin_note ?? null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
