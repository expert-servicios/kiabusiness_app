import { absoluteAppUrl } from '@/lib/utils/app-url';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveKiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import { getService } from '@/lib/services/service-registry';
import { getReadinessCheck, calculateReadinessResult } from '@/lib/data/service-readiness-checks';
import { validateKiaToolArguments, type KiaToolCall, type KiaToolResult } from './kia-tool-definitions';
import type { KiaContext } from './kia-context-builder';
import { redactJson, safeErrorMessage } from './kia-redaction';
import { resolveHoldedAuth, buildHoldedHeaders } from '@/lib/integrations/holded/holded-auth';
import { generateCompanyReport } from '@/lib/reports/report-generator';
import { extractInvoiceOcr, type InvoiceMediaType } from './kia-ocr-extractor';

export async function executeKiaToolCall(toolCall: KiaToolCall, context: KiaContext): Promise<KiaToolResult> {
  try {
    const args = validateKiaToolArguments(toolCall.name, toolCall.arguments);
    const admin = getSupabaseAdmin();

    switch (toolCall.name) {
      case 'resolve_contact_context': {
        const phone = typeof args.phone === 'string' ? args.phone : context.contact.phone;
        if (!phone) return ok(toolCall.name, { status: context.contact.status });
        const resolved = await resolveKiaContactContext(admin, phone);
        return ok(toolCall.name, {
          status: resolved.status,
          clientId: resolved.clientId,
          leadId: resolved.leadId,
          profileCompleted: resolved.profileCompleted,
          billingReady: resolved.billingReady,
          openCases: resolved.openCases.length,
        });
      }
      case 'get_client_profile':
        return ok(toolCall.name, { profile: context.profile, clientId: args.clientId });
      case 'get_service_registry_item': {
        const service = getService(String(args.serviceSlug));
        return ok(toolCall.name, service ? {
          slug: service.slug,
          name: service.name,
          flowType: service.flowType,
          hasCheckout: service.hasCheckout,
          hasReadiness: service.hasReadiness,
          requiresHolded: service.requiresHoldedApi || service.requiresHoldedLicense,
        } : { found: false });
      }
      case 'run_readiness_check': {
        const check = getReadinessCheck(String(args.serviceSlug));
        if (!check) return ok(toolCall.name, { found: false });
        const answers = args.answers as Record<string, string | string[]>;
        const result = calculateReadinessResult(check, answers);
        return ok(toolCall.name, { readiness: result });
      }
      case 'run_viability_check':
        return ok(toolCall.name, {
          status: 'schema_only',
          message: 'Viability execution remains in existing backend flow; use run_viability nextAction.',
        });
      case 'get_holded_connection_status':
        return ok(toolCall.name, {
          status: context.company?.holdedConnected ? 'active' : 'missing',
          permissions: context.company?.holdedPermissions ?? {},
        });
      case 'generate_checkout_gate_link':
        return ok(toolCall.name, {
          url: absoluteAppUrl(`/contratar?service=${encodeURIComponent(String(args.serviceSlug))}&source=${encodeURIComponent(String(args.source ?? 'kia'))}`),
          createsStripeCheckout: false,
        });
      case 'generate_profile_link':
        return ok(toolCall.name, { url: loginUrl(String(args.next ?? '/dashboard/perfil')) });
      case 'generate_holded_connection_link':
        return ok(toolCall.name, { url: loginUrl(String(args.next ?? '/dashboard/integraciones/holded')) });
      case 'get_case_status':
        return ok(toolCall.name, { cases: context.cases });
      case 'classify_document':
        return ok(toolCall.name, {
          status: 'schema_only',
          message: 'Document classification is handled by document classifier task; no mutation executed.',
        });
      case 'create_next_best_action':
      case 'create_internal_task':
        return ok(toolCall.name, {
          status: 'draft_only',
          draft: redactJson(args),
          requiresAdminConfirmation: true,
        });
      case 'get_company_status_snapshot':
        return ok(toolCall.name, context.accounting);
      case 'extract_invoice_ocr': {
        const mediaUrl = String(args.mediaUrl ?? '');
        const mediaType = String(args.mediaType ?? 'image/jpeg') as InvoiceMediaType;
        if (!mediaUrl) return fail(toolCall.name, 'mediaUrl is required');
        const openAiKey = process.env.OPENAI_API_KEY?.trim();
        if (!openAiKey) return fail(toolCall.name, 'OpenAI not configured (OPENAI_API_KEY missing)');
        const ocrResult = await extractInvoiceOcr({ mediaUrl, mediaType, openAiApiKey: openAiKey });
        return ok(toolCall.name, ocrResult as unknown as Record<string, unknown>);
      }
      case 'create_kia_decision_log':
        return ok(toolCall.name, { status: 'handled_by_backend' });

      // ── Holded data tools ────────────────────────────────────────────────
      case 'get_holded_invoices':
      case 'get_holded_contacts':
      case 'get_holded_bank_balance': {
        const integrationId = await findHoldedIntegrationId(admin, context);
        if (!integrationId) {
          return fail(toolCall.name, 'Holded no está conectado. Usa generate_holded_connection_link para que el cliente lo vincule.');
        }
        const auth = await resolveHoldedAuth(integrationId);
        const hdrs = buildHoldedHeaders(auth.apiKey);

        if (toolCall.name === 'get_holded_invoices') {
          const docType = String(args.docType ?? 'invoice');
          const limit   = Number(args.limit ?? 10);
          const res = await fetch(`${auth.baseUrl}/documents/${docType}?limit=${limit}`, { headers: hdrs });
          if (!res.ok) return fail(toolCall.name, `Holded devolvió ${res.status}`);
          const docs = (await res.json()) as Array<Record<string, unknown>>;
          return ok(toolCall.name, {
            count: docs.length,
            documents: docs.slice(0, limit).map(d => ({
              id     : d.id,
              number : d.docNumber,
              date   : d.date,
              contact: d.contactName,
              total  : d.total,
              status : d.status,
            })),
          });
        }

        if (toolCall.name === 'get_holded_contacts') {
          const query = typeof args.query === 'string' ? `?name=${encodeURIComponent(args.query)}` : '';
          const res   = await fetch(`${auth.baseUrl}/contacts${query}`, { headers: hdrs });
          if (!res.ok) return fail(toolCall.name, `Holded devolvió ${res.status}`);
          const contacts = (await res.json()) as Array<Record<string, unknown>>;
          const limit = Number(args.limit ?? 10);
          return ok(toolCall.name, {
            count   : contacts.length,
            contacts: contacts.slice(0, limit).map(c => ({
              id     : c.id,
              name   : c.name,
              email  : c.email,
              type   : c.type,
              vatNumber: c.vatnumber,
            })),
          });
        }

        if (toolCall.name === 'get_holded_bank_balance') {
          const res = await fetch(`${auth.baseUrl}/treasury`, { headers: hdrs });
          if (!res.ok) return fail(toolCall.name, `Holded devolvió ${res.status}`);
          const accounts = (await res.json()) as Array<Record<string, unknown>>;
          const limit = Number(args.limit ?? 5);
          return ok(toolCall.name, {
            count   : accounts.length,
            accounts: accounts.slice(0, limit).map(a => ({
              id     : a.id,
              name   : a.name,
              balance: a.balance,
              currency: a.currency ?? 'EUR',
            })),
          });
        }

        return fail(toolCall.name, 'Tool branch unreachable');
      }

      case 'generate_company_report': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No se puede generar el informe sin un cliente identificado.');

        const companyId = (context.company as Record<string, unknown> | null)?.id as string | null ?? null;
        const integrationId = await findHoldedIntegrationId(admin, context);
        if (!integrationId) {
          return fail(toolCall.name, 'Holded no está conectado. Usa generate_holded_connection_link para que el cliente lo vincule primero.');
        }

        try {
          const result = await generateCompanyReport({
            clientId,
            companyId,
            integrationId,
            period     : typeof args.period === 'string' ? args.period : undefined,
            lang       : (args.lang as 'es' | 'ru') ?? 'es',
            generatedBy: 'kia',
          });
          return ok(toolCall.name, {
            reportId : result.reportId,
            reportUrl: result.reportUrl,
            title    : result.title,
            period   : result.period,
            message  : `Informe generado correctamente para el periodo ${result.period}.`,
          });
        } catch (err) {
          return fail(toolCall.name, `Error generando el informe: ${safeErrorMessage(err)}`);
        }
      }

      case 'get_user_expedientes': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const statusFilter = String(args.status ?? 'activos');
        const limit = Number(args.limit ?? 10);

        let query = admin.from('cases').select('id, service, category, state, opened_at').eq('client_id', clientId);
        if (statusFilter === 'activos') {
          query = query.not('state', 'in', '("finalizado","cerrado","entregado")');
        } else if (statusFilter === 'finalizados') {
          query = query.in('state', ['finalizado', 'cerrado', 'entregado']);
        }
        const { data, error } = await query.order('opened_at', { ascending: false }).limit(limit);
        if (error) return fail(toolCall.name, 'Error consultando expedientes.');
        const rows = (data ?? []) as Array<{ id: string; service: string; category: string | null; state: string; opened_at: string }>;
        return ok(toolCall.name, {
          count: rows.length,
          expedientes: rows.map((c) => ({
            id: c.id,
            servicio: c.service,
            categoria: c.category,
            estado: c.state,
            fecha_apertura: c.opened_at,
            url: `/dashboard/expedientes/${c.id}`,
          })),
        });
      }

      case 'get_user_companies': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const limit = Number(args.limit ?? 5);
        const { data, error } = await admin
          .from('profile_companies')
          .select('role, company:companies(id, razon_social, nombre_comercial, cif_nif, forma_juridica)')
          .eq('profile_id', clientId)
          .limit(limit);
        if (error) return fail(toolCall.name, 'Error consultando empresas.');
        const rows = (data ?? []) as unknown as Array<{ role: string; company: Record<string, unknown> | null }>;
        return ok(toolCall.name, {
          count: rows.length,
          empresas: rows.map((r) => {
            const c = Array.isArray(r.company) ? r.company[0] : r.company;
            return {
              id: (c as Record<string, unknown>)?.id,
              nombre: (c as Record<string, unknown>)?.nombre_comercial ?? (c as Record<string, unknown>)?.razon_social,
              cif_nif: (c as Record<string, unknown>)?.cif_nif,
              forma_juridica: (c as Record<string, unknown>)?.forma_juridica,
              rol: r.role,
            };
          }),
        });
      }

      case 'get_user_pending_docs': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const caseId = typeof args.caseId === 'string' ? args.caseId : undefined;
        let query = admin.from('documents').select('id, original_name, state, case_id, created_at').eq('client_id', clientId).eq('state', 'pendiente');
        if (caseId) query = query.eq('case_id', caseId);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(10);
        if (error) return fail(toolCall.name, 'Error consultando documentos.');
        const rows = (data ?? []) as Array<{ id: string; original_name: string | null; state: string; case_id: string | null; created_at: string }>;
        return ok(toolCall.name, {
          pending_count: rows.length,
          documentos: rows.map((d) => ({
            id: d.id,
            nombre: d.original_name,
            expediente_id: d.case_id,
          })),
        });
      }

      default:
        return fail(toolCall.name, `Tool not allowed: ${toolCall.name}`);
    }
  } catch (error) {
    return fail(toolCall.name, safeErrorMessage(error));
  }
}

function loginUrl(nextPath: string): string {
  return absoluteAppUrl(`/auth/login?next=${encodeURIComponent(nextPath)}`);
}

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result: redactJson(result) };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}

/** Finds the active Holded integration ID for the current context (client or company). */
async function findHoldedIntegrationId(
  admin  : ReturnType<typeof getSupabaseAdmin>,
  context: KiaContext,
): Promise<string | null> {
  const clientId  = context.contact?.clientId  ?? null;
  const companyId = context.company?.id ?? null;

  let query = admin
    .from('client_integrations')
    .select('id')
    .eq('provider', 'holded')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (companyId) {
    query = query.eq('company_id', companyId);
  } else if (clientId) {
    query = query.eq('client_id', clientId);
  } else {
    return null;
  }

  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}
