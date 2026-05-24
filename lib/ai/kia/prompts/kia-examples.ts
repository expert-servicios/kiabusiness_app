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
</examples>
`.trim();
