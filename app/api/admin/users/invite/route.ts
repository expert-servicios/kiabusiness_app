import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { newUserRegisteredAdmin } from '@/lib/email/templates';
import { isStaffRole } from '@/lib/auth/roles';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(2, 'Nombre demasiado corto').optional(),
  entityType: z.enum(['empresa', 'autonomo']).optional(),
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
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive') return null;
  return isStaffRole(profile?.role) ? user.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = inviteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { email, fullName, entityType, company, phone, taxId, address, city, postalCode, mode } = parsed.data;
    const admin = getSupabaseAdmin();
    const normalizedEmail = email.toLowerCase();
    const normalizedTaxId = taxId?.trim().toUpperCase() || null;

    const listData = await listAllAuthUsers();
    const existing = listData.find((u) => u.email?.toLowerCase() === normalizedEmail);

    let userId: string;
    let isNewUser = false;

    if (existing) {
      userId = existing.id;
    } else {
      isNewUser = true;
      if (mode === 'invite_email') {
        const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName ?? '' }
        });
        if (inviteErr || !invited.user) {
          return NextResponse.json({ error: `Error al invitar: ${inviteErr?.message ?? 'desconocido'}` }, { status: 500 });
        }
        userId = invited.user.id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
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

    const profileData: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() };
    if (isNewUser) profileData.role = 'client';
    if (fullName) profileData.full_name = fullName;
    if (phone) profileData.phone = phone;
    if (company) profileData.company = company;
    if (normalizedTaxId) profileData.tax_id = normalizedTaxId;
    if (address) profileData.address = address;
    if (city) profileData.city = city;
    if (postalCode) profileData.postal_code = postalCode;
    if (entityType) profileData.client_type = entityType;

    const { error: upsertErr } = await admin.from('profiles').upsert(profileData, { onConflict: 'id' });
    if (upsertErr) {
      console.error('[admin/users/invite] profile upsert error:', upsertErr);
      return NextResponse.json({ error: 'No se pudo guardar el perfil del cliente' }, { status: 500 });
    }

    let companyId: string | null = null;
    const shouldCreateEntity = Boolean(company || normalizedTaxId || entityType === 'autonomo');

    if (shouldCreateEntity) {
      const { data: memberships } = await admin
        .from('profile_companies')
        .select('company_id,company:companies(id,cif_nif,razon_social,forma_juridica)')
        .eq('profile_id', userId);

      if (normalizedTaxId) {
        for (const membership of memberships ?? []) {
          const rawCompany = membership.company;
          const ownedCompany = Array.isArray(rawCompany) ? rawCompany[0] : rawCompany;
          if (ownedCompany?.cif_nif?.toUpperCase() === normalizedTaxId) {
            companyId = membership.company_id;
            break;
          }
        }
      }

      if (!companyId) {
        const razonSocial = company?.trim() || fullName?.trim() || email.split('@')[0];
        const formaJuridica = entityType === 'autonomo' ? 'autonomo' : 'sl';
        const { data: createdCompany, error: companyError } = await admin
          .from('companies')
          .insert({
            user_id: userId,
            name: razonSocial,
            company_name: razonSocial,
            razon_social: razonSocial,
            cif_nif: normalizedTaxId,
            vat_id: normalizedTaxId,
            forma_juridica: formaJuridica,
            direccion: address ?? null,
            address: address ?? null,
            ciudad: city ?? null,
            city: city ?? null,
            codigo_postal: postalCode ?? null,
            pais: 'ES',
            country: 'ES',
            telefono: phone ?? null,
            phone: phone ?? null,
            email,
            status: 'active',
          })
          .select('id')
          .single();

        if (companyError || !createdCompany) {
          console.error('[admin/users/invite] company create error:', companyError);
          return NextResponse.json({ error: 'Usuario creado, pero no se pudo crear su entidad fiscal' }, { status: 500 });
        }
        companyId = createdCompany.id;

        const { error: membershipError } = await admin.from('profile_companies').insert({
          profile_id: userId,
          company_id: companyId,
          role: 'owner'
        });
        if (membershipError) {
          console.error('[admin/users/invite] membership error:', membershipError);
          return NextResponse.json({ error: 'Entidad creada, pero no se pudo vincular al usuario' }, { status: 500 });
        }
      }

      const { error: activeCompanyError } = await admin
        .from('profiles')
        .update({ active_company_id: companyId })
        .eq('id', userId);
      if (activeCompanyError) {
        console.error('[admin/users/invite] active company error:', activeCompanyError);
        return NextResponse.json({ error: 'No se pudo establecer la entidad activa del cliente' }, { status: 500 });
      }
    }

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: isNewUser ? (mode === 'invite_email' ? 'user.invited' : 'user.created') : 'user.profile_updated',
      entity: 'profiles',
      entity_id: userId,
      metadata: { email, mode, isNewUser, company_id: companyId, entity_type: entityType ?? null }
    }).then(() => {});

    if (isNewUser) {
      const adminEmail = process.env.ADMIN_EMAIL ?? 'info@expertconsulting.es';
      const tpl = newUserRegisteredAdmin({
        name: fullName ?? email,
        email,
        phone: phone ?? null,
        registrationMethod: mode === 'invite_email' ? 'Invitación por email' : 'Creación directa (admin)',
      });
      void sendEmail({ to: adminEmail, eventType: 'new_user_admin_alert', subject: tpl.subject, html: tpl.html });
    }

    return NextResponse.json({ ok: true, userId, companyId, isNewUser, email });
  } catch (err) {
    console.error('[admin/users/invite] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
