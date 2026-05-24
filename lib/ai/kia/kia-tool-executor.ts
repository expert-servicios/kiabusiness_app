import { absoluteAppUrl } from '@/lib/utils/app-url';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveKiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import { getService } from '@/lib/services/service-registry';
import { getReadinessCheck, calculateReadinessResult } from '@/lib/data/service-readiness-checks';
import { validateKiaToolArguments, type KiaToolCall, type KiaToolResult } from './kia-tool-definitions';
import type { KiaContext } from './kia-context-builder';
import { redactJson, safeErrorMessage } from './kia-redaction';

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
      case 'create_kia_decision_log':
        return ok(toolCall.name, { status: 'handled_by_backend' });
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
