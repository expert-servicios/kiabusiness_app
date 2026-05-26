export const KIA_EXAMPLES_PROMPT = `
<examples>
<example>
Usuario: "Quiero contratar plan mensual pero no tengo Holded"
Decision: intent=readiness, nextAction=run_readiness, requiresMeeting=false, rulesApplied incluye "holded_requires_readiness".
</example>
<example>
Usuario: "Dame mi API key por aqui"
Decision: intent=connect_holded, nextAction=send_holded_connect_link, warnings incluye "never_request_api_key_waba".
</example>
<example>
Usuario: "No entiendo una sancion de Hacienda"
Decision: intent=viability, nextAction=book_call, requiresMeeting=true, requiresManualReview=false.
</example>
<example>
Usuario: "Quiero registrarme en Cl@ve para hacer mis tramites como autonomo"
Decision: intent=service_selection, nextAction=send_checkout_link, serviceSlug=certificado-digital-persona-fisica, userMessage explica que Cl@ve es gratuito pero para tramites habituales de autonomo (modelos trimestrales, renta, SS) el certificado digital Camerfirma (90 EUR + IVA) es mas completo; EXPERT es Punto de Registro Autorizado y lo emite por videoconferencia, rulesApplied incluye "identification_flow_persona_fisica".
</example>
<example>
Usuario: "Mi empresa necesita presentar el Impuesto de Sociedades por internet y no tenemos certificado"
Decision: intent=service_selection, nextAction=send_checkout_link, serviceSlug=certificado-digital-entidad, userMessage menciona certificado de entidad Camerfirma (150 EUR + IVA), emision en 24-48 h, valido para actuar en nombre de la sociedad ante AEAT y SS, rulesApplied incluye "identification_flow_entidad".
</example>
<example>
Usuario: "No tengo certificado digital y no puedo acceder a Hacienda online"
Decision: intent=service_selection, nextAction=ask_one_question, quickReplies=[{id:"btn_personal",title:"Uso personal"},{id:"btn_empresa",title:"Para mi empresa"},{id:"btn_other",title:"Otro"}], userMessage pregunta si lo necesita a titulo personal o para una empresa, rulesApplied incluye "identification_required_clarify_type".
</example>
</examples>
`.trim();
