import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { newUserRegisteredAdmin } from '@/lib/email/templates';
import { isStaffRole } from '@/lib/auth/roles';
import { computeProfileReadiness } from '@/lib/utils/profile-readiness';

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
    const normalizedEmail = email.trim().toLowerCase();
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
    if (isNewUser) {
      if (company) profileData.company = company;
      if (normalizedTaxId) profileData.tax_id = normalizedTaxId;
      if (address) profileData.address = address;
      if (city) profileData.city = city;
      if (postalCode) profileData.postal_code = postalCode;
      if (entityType) profileData.client_type = entityType;

      const readiness = computeProfileReadiness({
        full_name: fullName ?? null,
        phone: phone ?? null,
        client_type: entityType ?? null,
        tax_id: normalizedTaxId,
        address: address ?? null,
        city: city ?? null,
        postal_code: postalCode ?? null,
      });
      profileData.profile_completed = readiness.profileCompleted;
      profileData.billing_ready = readiness.billingReady;
      profileData.habitual_address_ready = readiness.habitualAddressReady;
      if (readiness.profileCompleted) profileData.profile_completed_at = new Date().toISOString();
      if (readiness.billingReady) profileData.billing_ready_at = new Date().toISOString();
    }

    const { error: upsertErr } = await admin.from('profiles').upsert(profileData, { onConflict: 'id' });
    if (upsertErr) {
      console.error('[admin/users/invite] profile upsert error:', upsertErr);
      return NextResponse.json({ error: 'No se pudo guardar el perfil del cliente' }, { status: 500 });
    }

    let companyId: string | null = null;
    let createdCompanyId: string | null = null;
    const shouldCreateEntity = Boolean(company || normalizedTaxId || entityType === 'autonomo');

    if (shouldCreateEntity) {
      const { data: memberships, error: membershipsError } = await admin
        .from('profile_companies')
        .select('company_id,company:companies(id,cif_nif,razon_social,forma_juridica)')
        .eq('profile_id', userId);
      if (membershipsError) {
        return NextResponse.json({ error: 'No se pudieron consultar las entidades actuales del cliente' }, { status: 500 });
      }

      const ownedIds = new Set((memberships ?? []).map((m) => m.company_id));

      if (normalizedTaxId) {
        for (const membership of memberships ?? []) {
          const rawCompany = membership.company;
          const ownedCompany = Array.isArray(rawCompany) ? rawCompany[0] : rawCompany;
          if (ownedCompany?.cif_nif?.toUpperCase() === normalizedTaxId) {
            companyId = membership.company_id;
            break;
          }
        }

        const { data: globalMatches, error: globalError } = await admin
          .from('companies')
          .select('id,cif_nif,razon_social')
          .eq('cif_nif', normalizedTaxId)
          .limit(10);
        if (globalError) {
          return NextResponse.json({ error: 'No se pudo verificar el CIF/NIF de la entidad' }, { status: 500 });
        }
        const foreignMatches = (globalMatches ?? []).filter((row) => !ownedIds.has(row.id));
        if (!companyId && foreignMatches.length > 0) {
          return NextResponse.json({
            error: 'Ya existe una entidad con este CIF/NIF vinculada a otra cuenta. Revisión manual necesaria.',
            code: 'tax_id_conflict',
            existingCompanyIds: foreignMatches.map((row) => row.id)
          }, { status: 409 });
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
          return NextResponse.json({ error: 'Usuario preparado, pero no se pudo crear su entidad fiscal' }, { status: 500 });
        }
        companyId = createdCompany.id;
        createdCompanyId = companyId;

        const { error: membershipError } = await admin.from('profile_companies').insert({
          profile_id: userId,
          company_id: companyId,
          role: 'owner'
        });
        if (membershipError) {
          console.error('[admin/users/invite] membership error:', membershipError);
          await admin.from('companies').delete().eq('id', companyId);
          return NextResponse.json({ error: 'No se pudo vincular la nueva entidad al usuario; no se ha conservado el alta parcial.' }, { status: 500 });
        }
      }

      const { error: activeCompanyError } = await admin
        .from('profiles')
        .update({ active_company_id: companyId })
        .eq('id', userId);
      if (activeCompanyError) {
        console.error('[admin/users/invite] active company error:', activeCompanyError);
        if (createdCompanyId) {
          await admin.from('profile_companies').delete().eq('profile_id', userId).eq('company_id', createdCompanyId);
          await admin.from('companies').delete().eq('id', createdCompanyId);
        }
        return NextResponse.json({ error: 'No se pudo establecer la entidad activa del cliente' }, { status: 500 });
      }
    }

    // Every client onboarding must be visible in the 360 view. Reuse an open
    // onboarding case rather than creating duplicates when admin retries the flow.
    let onboardingCaseId: string | null = null;
    const { data: existingOnboarding, error: onboardingLookupError } = await admin
      .from('cases')
      .select('id,state,status,company_id')
      .eq('client_id', userId)
      .eq('service', 'Alta de usuario')
      .neq('state', 'finalizado')
      .limit(1)
      .maybeSingle();
    if (onboardingLookupError) {
      console.error('[admin/users/invite] onboarding lookup error:', onboardingLookupError);
    } else if (existingOnboarding) {
      onboardingCaseId = existingOnboarding.id;
      if (companyId && !existingOnboarding.company_id) {
        await admin.from('cases').update({ company_id: companyId, updated_at: new Date().toISOString() }).eq('id', existingOnboarding.id);
      }
    } else {
      const { data: createdCase, error: caseError } = await admin
        .from('cases')
        .insert({
          client_id: userId,
          company_id: companyId,
          category: 'onboarding',
          service: 'Alta de usuario',
          state: 'en_proceso',
          status: 'nuevo',
          priority: 'media',
          next_action: 'Completar contratación y onboarding',
          admin_note: 'Expediente creado automáticamente por el flujo de alta Admin.',
        })
        .select('id')
        .single();
      if (caseError) console.error('[admin/users/invite] onboarding case create error:', caseError);
      else onboardingCaseId = createdCase.id;
    }

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: isNewUser ? (mode === 'invite_email' ? 'user.invited' : 'user.created') : 'user.entity_onboarded',
      entity: 'profiles',
      entity_id: userId,
      metadata: { email, mode, isNewUser, company_id: companyId, entity_type: entityType ?? null, onboarding_case_id: onboardingCaseId }
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

    return NextResponse.json({ ok: true, userId, companyId, onboardingCaseId, isNewUser, email });
  } catch (err) {
    console.error('[admin/users/invite] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
