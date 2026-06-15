import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const profileUpdateSchema = z.object({
  full_name:         z.string().min(2).max(100).optional(),
  phone:             z.string().max(20).optional(),
  whatsapp_number:   z.string().max(20).optional(),
  whatsapp_consent:  z.boolean().optional(),
  active_company_id: z.string().uuid().nullable().optional(),
  client_type:       z.enum(['particular', 'autonomo', 'empresa']).optional(),
  company:           z.string().max(160).nullable().optional(),
  tax_id:            z.string().min(3).max(32).optional(),
  address:           z.string().min(3).max(220).optional(),
  city:              z.string().min(2).max(120).optional(),
  postal_code:       z.string().min(3).max(16).optional(),
  province:          z.string().max(120).nullable().optional(),
  billing_country:   z.string().min(2).max(2).optional(),
  habitual_address:  z.string().max(220).nullable().optional(),
  habitual_city:     z.string().max(120).nullable().optional(),
  habitual_postal_code: z.string().max(16).nullable().optional(),
  habitual_province: z.string().max(120).nullable().optional(),
  habitual_country:  z.string().min(2).max(2).optional()
}).refine((d) => Object.keys(d).length > 0, { message: 'Envía al menos un campo' });

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile, error: fetchError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id,role,full_name,phone,whatsapp_number,whatsapp_consent,country,active_company_id,client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,profile_completed,billing_ready,habitual_address_ready,onboarding_completed_at,created_at')
      .eq('id', user.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ profile: { ...profile, email: user.email } });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = profileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: currentProfile } = await admin
      .from('profiles')
      .select('full_name,phone,client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,profile_completed_at,billing_ready_at')
      .eq('id', user.id)
      .maybeSingle();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parseResult.data.full_name !== undefined) updates.full_name = parseResult.data.full_name;
    if (parseResult.data.phone !== undefined) updates.phone = parseResult.data.phone;
    if (parseResult.data.whatsapp_number !== undefined) updates.whatsapp_number = parseResult.data.whatsapp_number;
    if (parseResult.data.whatsapp_consent !== undefined) updates.whatsapp_consent = parseResult.data.whatsapp_consent;
    if (parseResult.data.active_company_id !== undefined) updates.active_company_id = parseResult.data.active_company_id;
    if (parseResult.data.client_type !== undefined) updates.client_type = parseResult.data.client_type;
    if (parseResult.data.company !== undefined) updates.company = parseResult.data.company;
    if (parseResult.data.tax_id !== undefined) updates.tax_id = parseResult.data.tax_id.trim().toUpperCase();
    if (parseResult.data.address !== undefined) updates.address = parseResult.data.address.trim();
    if (parseResult.data.city !== undefined) updates.city = parseResult.data.city.trim();
    if (parseResult.data.postal_code !== undefined) updates.postal_code = parseResult.data.postal_code.trim();
    if (parseResult.data.province !== undefined) updates.province = parseResult.data.province;
    if (parseResult.data.billing_country !== undefined) updates.billing_country = parseResult.data.billing_country.toUpperCase();
    if (parseResult.data.habitual_address !== undefined) updates.habitual_address = parseResult.data.habitual_address;
    if (parseResult.data.habitual_city !== undefined) updates.habitual_city = parseResult.data.habitual_city;
    if (parseResult.data.habitual_postal_code !== undefined) updates.habitual_postal_code = parseResult.data.habitual_postal_code;
    if (parseResult.data.habitual_province !== undefined) updates.habitual_province = parseResult.data.habitual_province;
    if (parseResult.data.habitual_country !== undefined) updates.habitual_country = parseResult.data.habitual_country.toUpperCase();

    const merged = { ...(currentProfile ?? {}), ...updates } as Record<string, unknown>;
    const has = (key: string) => typeof merged[key] === 'string' && String(merged[key]).trim().length > 0;
    const profileCompleted = has('full_name') && has('phone');
    const billingReady = has('client_type') && has('tax_id') && has('address') && has('city') && has('postal_code');
    const habitualAddressReady = merged.client_type === 'empresa'
      || (has('habitual_address') && has('habitual_city') && has('habitual_postal_code'));

    updates.profile_completed = profileCompleted;
    updates.billing_ready = billingReady;
    updates.habitual_address_ready = habitualAddressReady;
    if (profileCompleted && !currentProfile?.profile_completed_at) updates.profile_completed_at = new Date().toISOString();
    if (billingReady && !currentProfile?.billing_ready_at) updates.billing_ready_at = new Date().toISOString();

    const { data: profile, error: updateError } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id,full_name,phone,whatsapp_number,whatsapp_consent,client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,profile_completed,billing_ready,habitual_address_ready')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
