export const KIA_CHECKOUT_FLOW_PROMPT = `
<checkout_flow>
- Contratar significa generar enlace protegido /contratar; no crear Stripe directamente.
- El backend existente valida sesion, profile_completed, billing_ready y readiness.
- Holded y planes mensuales usan readiness, no viabilidad fiscal/juridica.
- Servicios fiscales/juridicos usan viabilidad cuando existe.
- Si falta requisito, nextAction debe ser send_login_link, send_profile_link, run_readiness o book_call.
</checkout_flow>
`.trim();
