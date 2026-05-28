/**
 * POST /api/company/associate
 *
 * Associates a suggested company payload with the current user's profile.
 * Creates or links the company record after explicit user confirmation.
 *
 * Privacy invariants:
 * - userConfirmed: true must be present in the request body — literal gate.
 * - Two-step duplicate check: looks for existing company in user's profile
 *   before creating a new record.
 * - Never auto-creates company without this endpoint being called.
 * - Audit log written for every call.
 *
 * Returns: { companyId, created: boolean, ok: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import {
  createServerSupabaseClient,
  getSupabaseAdmin,
}                                    from '@/lib/integrations/supabase';
import { validateSpanishTaxIdFormat } from '@/lib/integrations/company-data-resolver';

// ── Request schema ────────────────────────────────────────────────────────────

const normalizedPayloadSchema = z.object({
  name              : z.string().min(2).max(250),
  taxId             : z.string().min(7).max(20).optional(),
  registeredAddress : z.string().max(300).optional(),
  postalCode        : z.string().max(10).optional(),
  city              : z.string().max(100).optional(),
  province          : z.string().max(100).optional(),
  country           : z.string().length(2).default('ES'),
  shareCapital      : z.string().max(100).optional(),
  representativeName: z.string().max(200).optional(),
  representativeRole: z.string().max(100).optional(),
  incorporationDate : z.string().max(30).optional(),
  companyStatus     : z.string().max(100).optional(),
  source            : z.string().max(50),
  sourceUrl         : z.string().url().optional(),
  confidence        : z.enum(['high', 'medium', 'low']),
});

/** Overrides from the user-facing form (takes precedence over suggestion) */
const overridesSchema = z.object({
  razon_social     : z.string().min(2).max(250).optional(),
  cif_nif          : z.string().min(7).max(20).optional(),
  nombre_comercial : z.string().max(250).optional(),
  forma_juridica   : z.string().max(100).optional(),
  direccion        : z.string().max(300).optional(),
  ciudad           : z.string().max(100).optional(),
  provincia        : z.string().max(100).optional(),
  codigo_postal    : z.string().max(10).optional(),
  pais             : z.string().length(2).optional(),
  telefono         : z.string().max(30).optional(),
  email            : z.string().email().optional(),
  web              : z.string().url().optional(),
});

const associateSchema = z.object({
  /** Must be literally `true` — user must explicitly confirm */
  userConfirmed   : z.literal(true).refine((v) => v === true, {
    message: 'El usuario debe confirmar explicitamente los datos antes de guardar.',
  }),
  /** Suggestion UUID from company_data_suggestions (optional) */
  suggestionId    : z.string().uuid().optional(),
  /** The normalized suggestion payload to persist */
  normalizedPayload: normalizedPayloadSchema,
  /** User-edited overrides from the form (merged on top of suggestion) */
  overrides       : overridesSchema.optional(),
});

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = associateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { normalizedPayload, overrides, suggestionId } = parsed.data;
  const admin = getSupabaseAdmin();

  // ── Build merged company row ────────────────────────────────────────────────

  // Suggestion data as base; user overrides take precedence
  const taxIdRaw = overrides?.cif_nif ?? normalizedPayload.taxId;

  // Validate CIF if provided
  let normalizedTaxId: string | null = null;
  if (taxIdRaw) {
    const validation = validateSpanishTaxIdFormat(taxIdRaw);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error ?? 'CIF/NIF inválido', code: 'invalid_tax_id' },
        { status: 422 },
      );
    }
    // RGPD: no commercial enrichment persisted for personas físicas
    if (validation.type === 'nif' || validation.type === 'nie') {
      return NextResponse.json(
        { error: 'No se puede crear empresa con NIF/NIE de persona física', code: 'natural_person' },
        { status: 422 },
      );
    }
    normalizedTaxId = validation.normalized ?? taxIdRaw;
  }

  const razonSocial = overrides?.razon_social ?? normalizedPayload.name;

  const companyRow = {
    razon_social    : razonSocial,
    nombre_comercial: overrides?.nombre_comercial ?? null,
    cif_nif         : normalizedTaxId ?? null,
    forma_juridica  : overrides?.forma_juridica ?? 'otra',
    direccion       : overrides?.direccion ?? normalizedPayload.registeredAddress ?? null,
    ciudad          : overrides?.ciudad    ?? normalizedPayload.city              ?? null,
    provincia       : overrides?.provincia ?? normalizedPayload.province          ?? null,
    codigo_postal   : overrides?.codigo_postal ?? normalizedPayload.postalCode    ?? null,
    pais            : overrides?.pais      ?? normalizedPayload.country           ?? 'ES',
    telefono        : overrides?.telefono  ?? null,
    email           : overrides?.email     ?? null,
    web             : overrides?.web       ?? null,
  };

  // ── Two-step duplicate check ────────────────────────────────────────────────
  // Step 1: get all company IDs already associated with this user
  const { data: pcRows } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', user.id);

  const ownedIds = (pcRows ?? [])
    .map((r: { company_id: string | null }) => r.company_id)
    .filter((id): id is string => Boolean(id));

  // Step 2: check if any owned company has the same CIF
  if (normalizedTaxId && ownedIds.length > 0) {
    const { data: existing } = await admin
      .from('companies')
      .select('id, razon_social')
      .in('id', ownedIds)
      .eq('cif_nif', normalizedTaxId)
      .limit(1)
      .single();

    if (existing) {
      // Mark suggestion as accepted if provided
      if (suggestionId) {
        await admin
          .from('company_data_suggestions')
          .update({ selected_by_user: true, selected_at: new Date().toISOString() })
          .eq('id', suggestionId)
          .eq('profile_id', user.id)
          .then(() => null, () => null);
      }

      await writeAuditLog(admin, user.id, existing.id, 'duplicate_found', suggestionId ?? null);

      return NextResponse.json({
        ok       : true,
        companyId: existing.id,
        created  : false,
        note     : `Empresa con CIF ${normalizedTaxId} ya existe en tu perfil.`,
      });
    }
  }

  // ── Create company ──────────────────────────────────────────────────────────
  const { data: newCompany, error: createErr } = await admin
    .from('companies')
    .insert(companyRow)
    .select('id')
    .single();

  if (createErr || !newCompany) {
    console.error('[company/associate] Insert error:', createErr?.message);
    return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
  }

  // ── Link to user profile ────────────────────────────────────────────────────
  const { error: linkErr } = await admin
    .from('profile_companies')
    .insert({ profile_id: user.id, company_id: newCompany.id, role: 'owner' });

  if (linkErr) {
    // Roll back the company row so the user is not left with an unreachable record
    await admin.from('companies').delete().eq('id', newCompany.id).then(() => null, () => null);
    console.error('[company/associate] Failed to link company to profile, rolled back:', linkErr.message);
    return NextResponse.json({ error: 'Error vinculando empresa al perfil' }, { status: 500 });
  }

  // ── Mark suggestion accepted ────────────────────────────────────────────────
  if (suggestionId) {
    await admin
      .from('company_data_suggestions')
      .update({ selected_by_user: true, selected_at: new Date().toISOString() })
      .eq('id', suggestionId)
      .eq('profile_id', user.id)
      .then(() => null, () => null);
  }

  await writeAuditLog(admin, user.id, newCompany.id, 'created', suggestionId ?? null);

  return NextResponse.json({
    ok       : true,
    companyId: newCompany.id,
    created  : true,
  });
}

// ── Audit helper ─────────────────────────────────────────────────────────────

async function writeAuditLog(
  admin       : ReturnType<typeof getSupabaseAdmin>,
  userId      : string,
  companyId   : string,
  action      : 'created' | 'duplicate_found',
  suggestionId: string | null,
): Promise<void> {
  await admin
    .from('company_data_sources_log')
    .insert({
      user_id     : userId,
      source      : 'associate',
      query       : { companyId, action, suggestionId },
      result_count: 1,
      status      : 'ok',
      error       : null,
    })
    .then(() => null, () => null);
}
