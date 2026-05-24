# Kia Health Canary Tests

Ultima revision: 2026-05-24

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
- anti-repeticion conversacional con historial sintetico.

Cada canary valida `intent`, `nextAction`, reglas aplicadas, contenido prohibido, idioma, secretos y `requiresManualReview`.
El canary anti-repeticion compara la respuesta nueva con respuestas recientes y falla si supera el umbral de similitud configurado.
