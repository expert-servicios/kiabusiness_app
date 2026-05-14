import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(2, 'Nombre demasiado corto').optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  mode: z.enum(['admin_fill', 'invite_email']).default('invite_email')
});

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single();

  return profile?.role === 'admin' ? user.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { email, fullName, company, phone, taxId, address, city, postalCode, mode } = parsed.data;
    const adminSupabase = getSupabaseAdmin();

    // Check if user already exists in auth
    const { data: listData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    const existing = listData?.users?.find((u) => u.email === email);

    let userId: string;
    let isNewUser = false;

    if (existing) {
      userId = existing.id;
    } else {
      isNewUser = true;
      if (mode === 'invite_email') {
        const { data: invited, error: inviteErr } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName ?? '' }
        });
        if (inviteErr || !invited.user) {
          return NextResponse.json({ error: `Error al invitar: ${inviteErr?.message ?? 'desconocido'}` }, { status: 500 });
        }
        userId = invited.user.id;
      } else {
        const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: fullName ?? '' }
        });
        if (createErr || !created.user) {
          return NextResponse.json({ error: `Error al crear usuario: ${createErr?.message ?? 'desconocido'}` }, { status: 500 });
        }
        userId = created.user.id;
      }
    }

    // Upsert profile with provided fields
    const profileData: Record<string, unknown> = {
      id: userId,
      role: 'client',
      updated_at: new Date().toISOString()
    };
    if (fullName) profileData.full_name = fullName;
    if (phone) profileData.phone = phone;
    if (company) profileData.company = company;
    if (taxId) profileData.tax_id = taxId;
    if (address) profileData.address = address;
    if (city) profileData.city = city;
    if (postalCode) profileData.postal_code = postalCode;

    const { error: upsertErr } = await adminSupabase.from('profiles').upsert(profileData, { onConflict: 'id' });
    if (upsertErr) {
      console.error('[admin/users/invite] profile upsert error:', upsertErr);
    }

    await adminSupabase.from('audit_logs').insert({
      actor_id: actorId,
      action: isNewUser ? (mode === 'invite_email' ? 'user.invited' : 'user.created') : 'user.profile_updated',
      entity: 'profiles',
      entity_id: userId,
      metadata: { email, mode, isNewUser }
    }).then(() => {});

    return NextResponse.json({ ok: true, userId, isNewUser, email });
  } catch (err) {
    console.error('[admin/users/invite] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
