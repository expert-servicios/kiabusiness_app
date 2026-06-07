import { z } from 'zod';

export interface KiaToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  strict?: boolean;
}

export interface KiaToolCall {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface KiaToolResult {
  toolName: string;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

const emptyObjectSchema = z.object({}).strict();

export const kiaToolValidators = {
  resolve_contact_context: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    clientId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
  }).strict(),
  get_client_profile: z.object({
    clientId: z.string().uuid(),
  }).strict(),
  get_service_registry_item: z.object({
    serviceSlug: z.string().min(1),
  }).strict(),
  run_viability_check: z.object({
    serviceSlug: z.string().min(1),
    answers: z.record(z.string(), z.unknown()).default({}),
  }).strict(),
  run_readiness_check: z.object({
    serviceSlug: z.string().min(1),
    answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
  }).strict(),
  get_holded_connection_status: z.object({
    clientId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
  }).strict(),
  create_next_best_action: z.object({
    title: z.string().min(1),
    reason: z.string().min(1),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    clientId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
  }).strict(),
  classify_document: z.object({
    documentId: z.string().uuid().optional(),
    fileName: z.string().optional(),
    textPreview: z.string().max(2000).optional(),
  }).strict(),
  get_case_status: z.object({
    caseId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
  }).strict(),
  create_internal_task: z.object({
    title: z.string().min(1),
    description: z.string().max(2000).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    clientId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
  }).strict(),
  generate_checkout_gate_link: z.object({
    serviceSlug: z.string().min(1),
    source: z.string().default('kia'),
  }).strict(),
  generate_profile_link: z.object({
    next: z.string().default('/dashboard/perfil'),
  }).strict(),
  generate_holded_connection_link: z.object({
    next: z.string().default('/dashboard/integraciones/holded'),
  }).strict(),
  get_company_status_snapshot: z.object({
    companyId: z.string().uuid().optional(),
  }).strict(),
  get_accounting_snapshot: z.object({
    companyId: z.string().uuid().optional(),
    includeAnomalies: z.boolean().default(true),
    periods: z.number().int().min(1).max(4).default(1),
  }).strict(),
  // ── Holded data tools (require active client integration) ─────────────────
  get_holded_invoices: z.object({
    docType  : z.enum(['invoice', 'salesreceipt', 'purchase', 'creditnote']).default('invoice'),
    limit    : z.number().int().min(1).max(20).default(10),
    since    : z.string().optional(), // ISO date — filter by date
  }).strict(),
  get_holded_contacts: z.object({
    query    : z.string().max(100).optional(), // search term
    limit    : z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_holded_bank_balance: z.object({
    limit    : z.number().int().min(1).max(10).default(5),
  }).strict(),
  generate_company_report: z.object({
    reportType: z.enum(['empresa_status']).default('empresa_status'),
    period    : z.string().optional(),
    lang      : z.enum(['es', 'ru']).default('es'),
  }).strict(),
  extract_invoice_ocr: z.object({
    mediaUrl: z.string().url(),
    mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  }).strict(),
  create_kia_decision_log: emptyObjectSchema,
  get_user_expedientes: z.object({
    status: z.enum(['activos', 'finalizados', 'todos']).default('activos'),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_user_companies: z.object({
    limit: z.number().int().min(1).max(10).default(5),
  }).strict(),
  get_user_pending_docs: z.object({
    caseId: z.string().uuid().optional(),
  }).strict(),
} satisfies Record<string, z.ZodTypeAny>;

type ToolName = keyof typeof kiaToolValidators;

function toJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema);
  return JSON.parse(JSON.stringify(jsonSchema)) as Record<string, unknown>;
}

const TOOL_DESCRIPTIONS: Record<ToolName, string> = {
  resolve_contact_context: 'Resolve whether the contact is a lead, client, or unknown.',
  get_client_profile: 'Get safe profile readiness flags for a registered client.',
  get_service_registry_item: 'Get service flow, readiness, viability and checkout metadata.',
  run_viability_check: 'Evaluate a service viability check with provided answers.',
  run_readiness_check: 'Evaluate a readiness check with provided answers.',
  get_holded_connection_status: 'Return Holded connection status without API keys.',
  create_next_best_action: 'Draft a next best action for backend/admin review.',
  classify_document: 'Classify a document using safe metadata or text preview.',
  get_case_status: 'Return status of one case or recent client cases.',
  create_internal_task: 'Draft an internal task for backend/admin review.',
  generate_checkout_gate_link: 'Generate a protected /contratar link; does not create Stripe checkout.',
  generate_profile_link: 'Generate secure profile/login link.',
  generate_holded_connection_link: 'Generate secure Holded connection panel link.',
  get_company_status_snapshot: 'Return safe company/accounting snapshot summary if available.',
  get_accounting_snapshot: 'Return full accounting period snapshots and open anomalies for a company. Use when the user asks about financial data, quarterly results, IVA, cash flow, or accounting anomalies. Requires companyId in context.',
  get_holded_invoices: 'List recent Holded invoices or purchases for the client. Requires active Holded integration.',
  get_holded_contacts: 'Search or list Holded contacts/clients. Requires active Holded integration.',
  get_holded_bank_balance: 'Return Holded treasury account balances. Requires active Holded integration.',
  generate_company_report: 'Generate a visual company status report (IVA, cash flow, anomalies, bank balances) and return a link the client can open. Requires active Holded integration.',
  extract_invoice_ocr: 'Extract structured invoice data (vendor, amount, VAT, date, invoice number) from an image using GPT-4o vision. Use when user sends a photo of an invoice or receipt.',
  create_kia_decision_log: 'Persist a Kia decision log. Usually executed by backend automatically.',
  get_user_expedientes: 'List the authenticated user\'s own cases (expedientes). Use when the user asks "mis expedientes", "mis trámites", "qué tengo pendiente", or any question about their own cases. Returns status, service name, and ID.',
  get_user_companies: 'List the authenticated user\'s own companies. Use when the user asks "mis empresas", "mis sociedades", or questions about their company data.',
  get_user_pending_docs: 'List documents pending upload or review for the authenticated user. Use when the user asks "qué documentos me piden", "documentos pendientes", or similar.',
};

export const KIA_TOOL_DEFINITIONS: KiaToolDefinition[] = (Object.keys(kiaToolValidators) as ToolName[]).map((name) => ({
  name,
  description: TOOL_DESCRIPTIONS[name],
  input_schema: toJsonSchema(kiaToolValidators[name]),
  strict: true,
}));

export function getKiaToolDefinition(name: string): KiaToolDefinition | null {
  return KIA_TOOL_DEFINITIONS.find((tool) => tool.name === name) ?? null;
}

export function validateKiaToolArguments(name: string, args: Record<string, unknown>): Record<string, unknown> {
  const validator = kiaToolValidators[name as ToolName];
  if (!validator) throw new Error(`Unsupported Kia tool: ${name}`);
  return validator.parse(args) as Record<string, unknown>;
}
