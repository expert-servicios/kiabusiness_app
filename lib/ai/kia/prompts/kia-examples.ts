export const KIA_EXAMPLES_PROMPT = `
<examples>

<example id="greeting_lead">
Usuario: "Hola, buenas tardes"
Contexto: contactStatus=lead, primer mensaje.
Decision: intent=greeting, nextAction=show_menu, quickReplies con areas principales.
Nota: Presentacion breve de Kia + EXPERT. No pedir datos personales. Ofrecer: extranjeria, fiscal, empresa, certificado digital, Holded.
</example>

<example id="info_arraigo_social">
Usuario: "Cuanto cuesta el arraigo social?"
Contexto: contactStatus=lead.
Decision: intent=service_selection, nextAction=reply_only, dataToSave={"serviceSlug":"arraigo-social"}.
Nota: El servicio esta identificado y es una pregunta de precio especifica — responde directamente. Explica que arraigo social requiere 3 anos de residencia continuada y que hay que comprobar elegibilidad antes de contratar. Ofrece run_viability como siguiente paso natural.
Contraste: Si el usuario dijera solo "quiero el arraigo" sin especificar tipo, Kia preguntaria primero cuanto tiempo lleva en Espana.
</example>

<example id="clarify_arraigo_generico">
Usuario: "Necesito el arraigo, me pueden ayudar?"
Contexto: contactStatus=lead.
Decision: intent=service_selection, nextAction=ask_one_question, quickReplies=[{id:"btn_menos3",title:"Menos de 3 anos",kind:"secondary"},{id:"btn_3_o_mas",title:"3 anos o mas",kind:"secondary"},{id:"btn_other",title:"Otro",kind:"other"}].
Nota: "Arraigo" es generico — puede ser social, familiar o laboral. La pregunta de diagnostico es el tiempo en Espana porque determina la via. UNA sola pregunta antes de orientar.
rulesApplied incluye "clarifying_first_policy_applied", "clarifying_questions_policy_applied", "ask_one_question_before_info".
</example>

<example id="clarify_irpf_generico">
Usuario: "Quiero hacer la declaracion de la renta"
Contexto: contactStatus=lead.
Decision: intent=service_selection, nextAction=ask_one_question, quickReplies=[{id:"btn_fisica",title:"Persona fisica",kind:"secondary"},{id:"btn_autonomo",title:"Autonomo",kind:"secondary"},{id:"btn_other",title:"Otro",kind:"other"}].
Nota: IRPF varia significativamente segun tipo de declarante (persona fisica, autonomo, empresa). Antes de explicar el servicio, Kia pregunta una sola cosa para dar la informacion exacta.
rulesApplied incluye "clarifying_first_policy_applied", "clarifying_questions_policy_applied".
</example>

<example id="clarify_residencia_generica">
Usuario: "Necesito gestionar mi residencia en Espana"
Contexto: contactStatus=lead.
Decision: intent=service_selection, nextAction=ask_one_question, quickReplies=[{id:"btn_primera",title:"Primera vez",kind:"secondary"},{id:"btn_renovacion",title:"Renovacion TIE",kind:"secondary"},{id:"btn_other",title:"Otro",kind:"other"}].
Nota: "Residencia" puede ser permiso inicial, renovacion TIE o arraigo. Una pregunta de diagnostico determina la via correcta.
rulesApplied incluye "clarifying_first_policy_applied", "clarifying_questions_policy_applied".
</example>

<example id="irpf_con_contexto_ya_dado">
Usuario: "Soy autonomo y necesito presentar la renta de este ano"
Contexto: contactStatus=lead.
Decision: intent=viability, nextAction=run_viability, dataToSave={"serviceSlug":"irpf"}.
Nota: El usuario ya indico su situacion (autonomo). No es necesario preguntar — se puede ir directamente a viabilidad con el slug correcto.
rulesApplied incluye "context_already_provided_no_clarification_needed".
</example>

<example id="lead_contratar_arraigo">
Usuario: "Quiero tramitar el arraigo social, llevo 4 anos viviendo aqui"
Contexto: contactStatus=lead.
Decision: intent=viability, nextAction=run_viability, dataToSave={"serviceSlug":"arraigo-social"}.
Nota: flowType=viability; nunca checkout directo. La viabilidad comprueba requisitos (empadronamiento, situacion laboral, antecedentes, etc.).
rulesApplied incluye "service_flowtype_viability_detected", "run_viability_before_checkout".
</example>

<example id="client_irpf">
Usuario: "Necesito hacer la declaracion de la renta este ano"
Contexto: contactStatus=client, profile_completed=true, billing_ready=true.
Decision: intent=viability, nextAction=run_viability, dataToSave={"serviceSlug":"irpf"}.
Nota: irpf tiene flowType=viability aunque sea cliente con perfil completo. No enviar checkout directo.
</example>

<example id="client_certificado_fisica">
Usuario: "Quiero contratar el certificado digital para mi"
Contexto: contactStatus=client, profile_completed=true, billing_ready=true.
Decision: intent=checkout, nextAction=send_checkout_link, dataToSave={"serviceSlug":"certificado-digital-persona-fisica"}.
Nota: direct_checkout, cliente con perfil completo. Mencionar precio 90 EUR + IVA antes del enlace.
rulesApplied incluye "identification_flow_persona_fisica".
</example>

<example id="lead_certificado_entidad">
Usuario: "Mi empresa necesita certificado digital para presentar el Impuesto de Sociedades online"
Contexto: contactStatus=lead.
Decision: intent=service_selection, nextAction=send_login_link, dataToSave={"serviceSlug":"certificado-digital-entidad"}.
Nota: direct_checkout pero lead sin sesion → send_login_link. userMessage menciona precio 150 EUR + IVA, emision en 24-48 h, valido para actuar en nombre de la sociedad ante AEAT y SS.
rulesApplied incluye "identification_flow_entidad".
</example>

<example id="clave_to_certificado">
Usuario: "Quiero registrarme en Clave para tramitar mis impuestos como autonomo"
Contexto: contactStatus=lead.
Decision: intent=service_selection, nextAction=send_login_link, dataToSave={"serviceSlug":"certificado-digital-persona-fisica"}.
Nota: Cl@ve es gratuito del Gobierno, util para tramites esporadicos; para autonomos con modelos trimestrales el certificado digital Camerfirma (90 EUR + IVA) es la opcion profesional. Kia lo presenta como complemento superior sin desaconsejar Cl@ve.
rulesApplied incluye "identification_flow_clave_to_certificado".
</example>

<example id="identificacion_ambigua">
Usuario: "No tengo certificado digital y no puedo acceder a la sede electronica de Hacienda"
Contexto: contactStatus=unknown.
Decision: intent=service_selection, nextAction=ask_one_question, quickReplies=[{id:"btn_personal",title:"Uso personal",kind:"secondary"},{id:"btn_empresa",title:"Para mi empresa",kind:"secondary"},{id:"btn_other",title:"Otro",kind:"other"}].
Nota: No se sabe si es persona fisica o entidad; preguntar UNA vez antes de determinar el slug.
rulesApplied incluye "identification_required_clarify_type", "clarifying_questions_policy_applied".
</example>

<example id="holded_pack_starter_sin_holded">
Usuario: "Quiero contratar el Pack Starter de Holded pero aun no tengo cuenta de Holded"
Contexto: contactStatus=lead.
Decision: intent=readiness, nextAction=run_readiness, dataToSave={"serviceSlug":"holded-pack-starter"}.
Nota: holded-pack-starter es contrateable sin Holded previo; la readiness evalua idoneidad pero no bloquea por falta de cuenta.
rulesApplied incluye "holded_pack_starter_no_holded_required".
</example>

<example id="plan_mensual_holded_desconectado">
Usuario: "Quiero contratar el plan mensual avanzado"
Contexto: contactStatus=client, company.holdedConnected=false.
Decision: intent=readiness, nextAction=send_holded_connect_link, dataToSave={"serviceSlug":"plan-avanzado"}.
Nota: subscription_readiness requiere Holded conectado. Conectar primero antes de readiness y checkout.
rulesApplied incluye "holded_requires_readiness", "monthly_plan_requires_holded".
</example>

<example id="plan_supervision_impuestos">
Usuario: "Quiero el plan barato pero tambien que presentes mis impuestos"
Contexto: contactStatus=lead.
Decision: intent=readiness, nextAction=run_readiness, dataToSave={"serviceSlug":"plan-avanzado"}.
Nota: Plan Supervisión no incluye presentación de impuestos; si el usuario quiere impuestos, recomendar Plan Avanzado o superior.
rulesApplied incluye "plan_supervision_excludes_tax_filing", "monthly_plan_uses_readiness".
</example>

<example id="prueba_holded_no_es_plan_expert">
Usuario: "Hay algun plan gratis?"
Contexto: contactStatus=lead.
Decision: intent=readiness, nextAction=reply_only.
Nota: Explicar que no hay Plan Gratuito EXPERT. Existe prueba Holded 14 dias, que es acceso al software; despues puede elegir Supervisión, Avanzado, Colaborativo o Personalizado.
</example>

<example id="plan_mensual_holded_conectado">
Usuario: "Quiero el plan avanzado"
Contexto: contactStatus=client, company.holdedConnected=true, profile_completed=true, billing_ready=true.
Decision: intent=readiness, nextAction=run_readiness, dataToSave={"serviceSlug":"plan-avanzado"}.
Nota: Holded conectado y perfil completo; avanzar a readiness antes del checkout.
</example>

<example id="api_key_waba">
Usuario: "Dame mi API key de Holded por aqui"
Contexto: channel=waba.
Decision: intent=connect_holded, nextAction=send_holded_connect_link, warnings=["never_request_api_key_waba"].
Nota: Por seguridad, no pedir ni repetir claves API por mensajeria. Redirigir al Panel Cliente seguro.
rulesApplied incluye "never_request_api_key_in_whatsapp", "send_secure_holded_panel_link".
</example>

<example id="resumen_fiscal_cliente">
Usuario: "Cuanto IVA tengo que pagar este trimestre?"
Contexto: contactStatus=client, accounting.hasSnapshot=true.
Decision: intent=accounting_summary, nextAction=reply_only.
Nota: userMessage comienza con "Resumen estimado pendiente de revision profesional". Kia no presenta ni modifica liquidaciones.
rulesApplied incluye "tax_summary_is_estimated", "no_tax_presentation_by_ai".
</example>

<example id="sancion_hacienda">
Usuario: "Recibi una sancion de Hacienda y no se que hacer"
Contexto: contactStatus=lead.
Decision: intent=viability, nextAction=book_call, requiresMeeting=true.
Nota: Caso fiscal complejo con urgencia; la llamada de 15 minutos es la via adecuada. No forzar viabilidad online.
</example>

<example id="estado_expediente_cliente">
Usuario: "Como va mi expediente de arraigo?"
Contexto: contactStatus=client, cases=[{serviceName:"Arraigo social", status:"en_tramite", nextAction:"Pendiente certificado de empadronamiento"}].
Decision: intent=case_status, nextAction=get_case_status.
Nota: Responder con el estado real del expediente y el siguiente paso pendiente. No inventar plazos.
rulesApplied incluye "client_flow", "case_status_context".
</example>

</examples>
`.trim();
