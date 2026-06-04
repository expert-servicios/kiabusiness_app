import type { KiaChannel, KiaTaskType } from "./kia-output-schema";
import { KIA_CORE_POLICY_PROMPT } from "./prompts/kia-core-policy";
import { KIA_LEAD_FLOW_PROMPT } from "./prompts/kia-lead-flow";
import { KIA_CLIENT_FLOW_PROMPT } from "./prompts/kia-client-flow";
import { KIA_ACCOUNTING_FLOW_PROMPT } from "./prompts/kia-accounting-flow";
import { KIA_DOCUMENT_FLOW_PROMPT } from "./prompts/kia-document-flow";
import { KIA_CHECKOUT_FLOW_PROMPT } from "./prompts/kia-checkout-flow";
import { KIA_IDENTIFICATION_FLOW_PROMPT } from "./prompts/kia-identification-flow";
import { KIA_EXAMPLES_PROMPT } from "./prompts/kia-examples";
import { KIA_CLARIFYING_POLICY_PROMPT } from "./prompts/kia-clarifying-policy";
import { KIA_SERVICES_CATALOG_PROMPT } from "./prompts/kia-services-catalog";
import { KIA_HOLDED_KNOWLEDGE_PROMPT } from "./prompts/kia-holded-knowledge";
import { KIA_AEAT_KNOWLEDGE_PROMPT } from "./prompts/kia-aeat-knowledge";
import { KIA_SS_KNOWLEDGE_PROMPT } from "./prompts/kia-ss-knowledge";
import { KIA_DGT_KNOWLEDGE_PROMPT } from "./prompts/kia-dgt-knowledge";
import { KIA_JUSTICIA_REGISTROS_KNOWLEDGE_PROMPT } from "./prompts/kia-justicia-registros-knowledge";
import { KIA_PAE_KNOWLEDGE_PROMPT } from "./prompts/kia-pae-knowledge";
import { KIA_CCAA_KNOWLEDGE_PROMPT } from "./prompts/kia-ccaa-knowledge";

const HOLDED_CONTEXT_RE =
  /\bholded\b|pack starter|migraci[oó]n holded|formaci[oó]n holded|plan supervision|plan avanzado|plan colaborativo|erp|control horario.*holded|holded.*control horario|холдед/i;
const AEAT_CONTEXT_RE =
  /\b(irpf|renta|iva|hacienda|aeat|agencia tributaria|modelo\s*\d{2,3}|tributar|declaraci[oó]n.*renta|impuesto.*renta|fiscal|036|037|130|131|303|390|720|151|beckham|verifactu|no residente|irnr|renta web|campan.*renta)\b/i;
const SS_CONTEXT_RE =
  /\b(seguridad social|reta|cotizaci[oó]n|cuota.*aut[oó]nom|aut[oó]nom.*cuota|vida laboral|importass|cese de actividad|tarifa plana|cuota reducida|baja.*laboral|alta.*aut[oó]nom|aut[oó]nom.*alta|inss|tgss|prestaci[oó]n.*aut[oó]nom|aut[oó]nom.*prestaci[oó]n)\b/i;
const DGT_CONTEXT_RE =
  /\b(dgt|trafico|transferencia.*vehiculo|vehiculo.*transferencia|matriculacion|canje.*permiso|permiso.*conducir|puntos.*carnet|carnet.*puntos|baja.*vehiculo|multa.*trafico|permiso de circulacion|ficha tecnica|capitania)\b/i;
const JUSTICIA_CONTEXT_RE =
  /\b(antecedentes penales|registro civil|apostilla|certificado.*nacimiento|nacimiento.*certificado|certificado.*matrimonio|denominacion social|nota simple|registro.*propiedad|registro.*mercantil|deposito.*cuentas|rmc)\b/i;
const PAE_CONTEXT_RE =
  /\b(pae|circe|crear empresa online|sl.*online|online.*sl|alta autonomo.*online|online.*alta autonomo|ventanilla unica|constitucion.*online|online.*constitucion)\b/i;
const CCAA_CONTEXT_RE =
  /\b(itp|transmisiones patrimoniales|isd|sucesiones|donaciones|ajd|actos juridicos documentados|impuesto.*herencia|herencia.*impuesto|impuesto de patrimonio|plusvalia.*municipal|iivtnu|suma.*alicante|atv.*valencia|hacienda.*comunidad|ccaa.*impuesto|impuesto.*regional)\b/i;

function matchesContext(
  re: RegExp,
  params: {
    currentPage?: string;
    currentTask?: string;
    pageData?: Record<string, unknown>;
  },
): boolean {
  const text = [
    params.currentPage ?? "",
    params.currentTask ?? "",
    JSON.stringify(params.pageData ?? {}),
  ].join(" ");
  return re.test(text);
}

export function buildKiaSystemPrompt(params: {
  locale: "es" | "ru";
  channel: KiaChannel;
  taskType: KiaTaskType;
  currentPage?: string;
  currentTask?: string;
  pageData?: Record<string, unknown>;
  includeHolded?: boolean;
  includeAeat?: boolean;
  includeSs?: boolean;
  includeDgt?: boolean;
  includeJusticia?: boolean;
  includePae?: boolean;
  includeCcaa?: boolean;
  fewShotBlock?: string;
  subAgentAddendum?: string;
}): string {
  const localeInstruction =
    params.locale === "ru"
      ? "Responde al usuario en ruso natural con alfabeto cirilico. El idioma del ULTIMO mensaje del usuario manda sobre el historial previo."
      : "Responde al usuario en espanol claro. El idioma del ULTIMO mensaje del usuario manda sobre el historial previo.";

  const withHolded =
    params.includeHolded ?? matchesContext(HOLDED_CONTEXT_RE, params);
  const withAeat =
    params.includeAeat ?? matchesContext(AEAT_CONTEXT_RE, params);
  const withSs = params.includeSs ?? matchesContext(SS_CONTEXT_RE, params);
  const withDgt = params.includeDgt ?? matchesContext(DGT_CONTEXT_RE, params);
  const withJusticia =
    params.includeJusticia ?? matchesContext(JUSTICIA_CONTEXT_RE, params);
  const withPae = params.includePae ?? matchesContext(PAE_CONTEXT_RE, params);
  const withCcaa =
    params.includeCcaa ?? matchesContext(CCAA_CONTEXT_RE, params);

  return `
<role>
Kia es la asistente virtual IA de EXPERT Asesoria.
Kia habla sobre si misma en femenino.
</role>

<mission>
Captar, orientar, clasificar, gestionar, explicar, resumir, detectar anomalias y guiar al siguiente paso operativo.
</mission>

${KIA_CORE_POLICY_PROMPT}

${KIA_SERVICES_CATALOG_PROMPT}

<expert_sources_of_truth>
- EXPERT manda en clientes, expedientes, documentos, comunicaciones y tareas.
- Holded aporta datos contables/fiscales.
- Stripe aporta cobros.
- GoCardless aporta bancos.
- Supabase guarda estado y trazabilidad.
</expert_sources_of_truth>

<behavior>
- ${localeInstruction}
- Canal actual: ${params.channel}. Tarea actual: ${params.taskType}.${
    params.currentPage
      ? `\n- Pagina actual del usuario: ${params.currentPage}.`
      : ""
  }${params.currentTask ? ` Tarea en curso: ${params.currentTask}.` : ""}${
    params.pageData && Object.keys(params.pageData).length > 0
      ? `\n- Datos de pagina: ${JSON.stringify(params.pageData)}.`
      : ""
  }${
    params.channel === "dashboard" && params.currentPage
      ? `
- SOPORTE PROACTIVO: el usuario esta en ${params.currentPage}. Si puede ser util, ofrece ayuda especifica para esa pagina sin esperar a que lo pida. Ejemplo: si esta en /dashboard/empresa/nueva, ofrece buscar datos publicos de su empresa. Si esta en /dashboard/informes, ofrece generar informe. Si esta en /dashboard/integraciones/holded y no tiene Holded conectado, guia para conectarlo.`
      : ""
  }
- Usa tono claro, profesional y amable. No uses tecnicismos innecesarios.
- Cuando hables de ti misma usa femenino: "encantada", "estoy segura", "preparada para ayudarte".
- Si context.contact.name no es null, dirigete al usuario por su primer nombre en el saludo o primera mencion natural.
- En WhatsApp usa mensajes breves con emojis de forma moderada.
- Formato WhatsApp: negrita con *asterisco simple*, NUNCA con **doble asterisco**. Cursiva con _guion bajo_. Sin ## ni bloques de codigo markdown.
- Antes de redactar userMessage, revisa conversation.recentMessages y selectedMessage si existe.
- Varia la redaccion segun historial; no repitas frases, aperturas, cierres, CTA ni estructura de parrafos.
- Si la respuesta operativa es la misma que antes, reconoce continuidad y aporta el siguiente dato util en vez de repetir literalmente.
- Si ya ofreciste llamada, portal, panel o enlace, no repitas la misma frase salvo que el usuario lo pida explicitamente.
- Puedes aprender estilo de respuestas humanas/admin previas, pero no copies literalmente ni ocultes que eres Kia.
</behavior>

${KIA_LEAD_FLOW_PROMPT}
${KIA_CLIENT_FLOW_PROMPT}
${KIA_ACCOUNTING_FLOW_PROMPT}
${KIA_DOCUMENT_FLOW_PROMPT}
${KIA_CHECKOUT_FLOW_PROMPT}
${KIA_IDENTIFICATION_FLOW_PROMPT}
${KIA_EXAMPLES_PROMPT}

${KIA_CLARIFYING_POLICY_PROMPT}

${withHolded ? KIA_HOLDED_KNOWLEDGE_PROMPT : ""}
${withAeat ? KIA_AEAT_KNOWLEDGE_PROMPT : ""}
${withSs ? KIA_SS_KNOWLEDGE_PROMPT : ""}
${withDgt ? KIA_DGT_KNOWLEDGE_PROMPT : ""}
${withJusticia ? KIA_JUSTICIA_REGISTROS_KNOWLEDGE_PROMPT : ""}
${withPae ? KIA_PAE_KNOWLEDGE_PROMPT : ""}
${withCcaa ? KIA_CCAA_KNOWLEDGE_PROMPT : ""}

${params.fewShotBlock ? `\n<few_shot_examples>\n${params.fewShotBlock}\n</few_shot_examples>` : ""}

${params.subAgentAddendum ? `\n<sub_agent_profile>\n${params.subAgentAddendum}\n</sub_agent_profile>` : ""}

<output_contract>
Devuelve UNICAMENTE JSON valido conforme al schema KiaDecision.
No incluyas markdown antes o despues.
El campo userMessage debe ser el texto breve listo para mostrar al usuario/admin.
El campo decisionSummary debe explicar de forma auditable la decision, sin chain-of-thought.
rulesApplied debe contener reglas concretas aplicadas.
requiresManualReview solo puede ser true para fallo tecnico, output invalido, ambiguedad extrema o toma manual admin.
</output_contract>
`.trim();
}
