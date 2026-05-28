import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  resolveCompanyData,
  validateSpanishTaxIdFormat,
  type CompanySuggestion,
} from '@/lib/integrations/company-data-resolver';

const bodySchema = z.object({
  name  : z.string().min(2).max(200).optional(),
  taxId : z.string().min(7).max(20).optional(),
  country: z.string().length(2).default('ES'),
}).refine((d) => d.name || d.taxId, { message: 'name o taxId requerido' });

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, taxId, country } = parsed.data;

  // Validate tax ID format before any external calls
  let taxIdValidation = null;
  if (taxId) {
    taxIdValidation = validateSpanishTaxIdFormat(taxId);
    if (!taxIdValidation.valid) {
      return NextResponse.json(
        { error: taxIdValidation.error ?? 'Formato de NIF/CIF inválido', code: 'invalid_tax_id', type: taxIdValidation.type },
        { status: 422 }
      );
    }
    // RGPD: no external enrichment for natural persons
    if (taxIdValidation.type === 'nif' || taxIdValidation.type === 'nie') {
      return NextResponse.json({
        suggestions          : [],
        bestSuggestion       : undefined,
        requiresUserConfirmation: true,
        taxIdType            : taxIdValidation.type,
        note                 : 'Para personas físicas no se consultan fuentes externas de enriquecimiento.',
      });
    }
  }

  const admin = getSupabaseAdmin();
  const startedAt = Date.now();

  // Run resolution
  let result: Awaited<ReturnType<typeof resolveCompanyData>>;
  let resolveError: string | null = null;
  try {
    result = await resolveCompanyData({ name, taxId: taxIdValidation?.normalized ?? taxId, country });
  } catch (err) {
    resolveError = err instanceof Error ? err.message : 'Error desconocido';
    result = { suggestions: [], bestSuggestion: undefined, requiresUserConfirmation: true };
  }

  // Persist each suggestion for audit + future user confirmation
  const savedIds: string[] = [];
  if (user && result.suggestions.length > 0) {
    for (const sug of result.suggestions) {
      const { data } = await admin
        .from('company_data_suggestions')
        .insert({
          profile_id        : user.id,
          input_name        : name ?? null,
          input_tax_id      : taxId ?? null,
          source            : sug.source,
          source_url        : sug.sourceUrl ?? null,
          retrieved_at      : sug.retrievedAt,
          confidence        : sug.confidence,
          warnings          : sug.warnings,
          normalized_payload: sug as unknown as Record<string, unknown>,
        })
        .select('id')
        .single();
      if (data?.id) savedIds.push(data.id);
    }
  }

  // Audit log (best-effort — don't fail the request if logging fails)
  await admin.from('company_data_sources_log').insert({
    user_id     : user?.id ?? null,
    source      : 'resolver',
    query       : { name, taxId, country },
    result_count: result.suggestions.length,
    status      : resolveError ? 'error' : result.suggestions.length === 0 ? 'empty' : 'ok',
    error       : resolveError,
  }).then(() => null, () => null);

  const elapsedMs = Date.now() - startedAt;

  return NextResponse.json({
    suggestions             : result.suggestions,
    bestSuggestion          : result.bestSuggestion,
    requiresUserConfirmation: true,
    suggestionIds           : savedIds,
    taxIdType               : taxIdValidation?.type ?? null,
    meta: {
      sources  : [...new Set(result.suggestions.map((s: CompanySuggestion) => s.source))],
      elapsedMs,
      queriedAt: new Date().toISOString(),
    },
  });
}

/** Mark a suggestion as accepted after user confirms it. */
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json() as { suggestionId?: string };
  if (!body.suggestionId) {
    return NextResponse.json({ error: 'suggestionId requerido' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('company_data_suggestions')
    .update({ selected_by_user: true, selected_at: new Date().toISOString() })
    .eq('id', body.suggestionId)
    .eq('profile_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
