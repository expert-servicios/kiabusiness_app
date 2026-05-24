# Kia Health Canary Tests

Ultima revision: 2026-05-23

Los canarios viven en `lib/ai/kia/health/kia-canary-tests.ts`.

Casos actuales:

- plan mensual sin Holded.
- API key por WhatsApp.
- migracion Holded.
- arraigo social.
- pagar sin login.
- presentar IVA.
- cliente pregunta expediente.
- mensaje ambiguo.
- idioma ruso.
- respuesta a mensaje seleccionado.

Cada canary valida `intent`, `nextAction`, reglas aplicadas, contenido prohibido, idioma, secretos y `requiresManualReview`.
