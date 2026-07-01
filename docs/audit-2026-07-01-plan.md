# Plan de remediación — Auditoría 2026-07-01

Documento de seguimiento para no perder el hilo entre sesiones. Cubre: panel admin,
WABA, formularios públicos, auth/dashboard cliente, emails, Holded, MCP y Kia.

Rama de trabajo: `claude/sharp-wozniak-1ohax6`.

---

## 0. Decisión: MCP de Holded (`apps/holded-mcp/`)

**Veredicto: NO integrar con Kia. Mantener como producto separado.**

- `apps/holded-mcp` es un conector remoto para Claude Desktop/Claude.ai: cada usuario
  final conecta su propia cuenta Holded vía OAuth (multi-tenant, PKCE, registro
  dinámico). Desplegado en `claude.expertconsulting.es`, activo (últ. commit hace 6
  días), con rate limiting y eventos de conector hacia EXPERT.
- Kia usa integración directa/global (`HOLDED_API_KEY` único, server-to-server) porque
  opera sobre la cuenta de Holded de **EXPERT**, no la de un usuario externo.
- Fusionar ambos rompería el aislamiento de cuentas y requeriría una capa de proxy
  MCP que la API de Anthropic Messages no soporta nativamente hoy.
- **Acción:** ninguna. No es código muerto, está mal etiquetado. Dejar tal cual.

---

## 1. CRÍTICOS

- [ ] **Escalada de privilegios en equipo** — un `admin` (no owner) puede asignar rol
      `TENANT_ADMIN`. Fix: solo `isOwner()` puede asignar `TENANT_ADMIN`/`OWNER`.
      `app/api/admin/team/route.ts:70-92`
- [ ] **Prompt injection en Kia** — `pageData` del cliente se inyecta sin sanitizar en
      el system prompt. Fix: validar con schema estricto / escapar antes de
      `JSON.stringify` en el prompt.
      `lib/ai/kia/kia-system-prompt.ts:115` (también en `app/api/kia/copilot/route.ts:195`)
- [ ] **Duplicados en recordatorios fiscales** — condición de carrera, flag no se
      marca atómicamente antes de enviar. Fix: marcar "processing" antes de enviar,
      como ya hace `email-queue`.
      `app/api/cron/fiscal-reminders/route.ts:69,111-114`
- [ ] **daily-summary sin try/catch en sendEmail()** — fallo derriba todo el cron sin
      log. Fix: envolver, devolver siempre 200 con detalle de fallos.
      `app/api/cron/daily-summary/route.ts:202-211`
- [ ] **iframe Cal.com sin sandbox** — riesgo XSS/clickjacking de tercero. Fix: añadir
      `sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"`.
      `app/(public)/cita/page.tsx:74-82`
- [ ] **Kia sin rate limiting ni control de coste** — gasto ilimitado por usuario.
      Fix: rate limit por usuario/sesión + cuota diaria de coste (usar
      `kia-cost-tracker.ts` ya existente, solo falta *enforcement*).
      `app/api/kia/copilot/route.ts`, `lib/ai/kia/kia-cost-tracker.ts`

## 2. ALTOS

- [ ] Sin flujo de reseteo de contraseña (solo magic link) → cuenta bloqueada si se
      pierde el email.
- [ ] Sin verificación de email en registro.
- [ ] WABA: endpoints no comprueban `status === 'inactive'` del admin.
      `app/api/admin/whatsapp/route.ts:1-14`
- [ ] WABA: normalización de teléfono inconsistente en `link-client` → duplicados.
      `app/api/admin/whatsapp/link-client/route.ts:42,113`
- [ ] WABA: falta `return` tras error en `WhatsAppInbox.tsx:569` → estado corrupto.
- [ ] Holded sync: job puede quedar en `status='running'` para siempre si falla el
      update tras completar. Fix: recovery query para jobs "running" >5 min.
      `app/api/cron/holded-sync/route.ts:108-138`
- [ ] Email queue: condición de carrera si 2 crons concurrentes reclaman el mismo job.
      `lib/email/email-queue.ts:102-109`
- [ ] Formularios públicos: sin validación de formato de teléfono (regex España).
- [ ] Formulario de viabilidad no envía email de aviso al equipo (solo al cliente).
      `app/api/services/viabilidad/route.ts:103-139`
- [ ] Reseñas: no se envía confirmación al cliente tras enviar su valoración.
      `app/api/reviews/submit/route.ts`

## 3. MEDIOS

- [ ] `/api/reports/generate` permite a un admin generar informes de clientes de
      otro tenant sin verificar aislamiento. `app/api/reports/generate/route.ts:32-44`
- [ ] `HOLDED_MCP_SESSION_SECRET` solo exige 16 bytes — débil para HS256, subir a 32.
      `app/api/auth/holded-claude/route.ts:28-31`
- [ ] Emails de clientes expuestos innecesariamente en listados admin
      (`/api/admin/users`, `/api/admin/team`).
- [ ] Sin logging de auditoría en cambios de rol de equipo.
- [ ] Accesibilidad: falta `aria-live`/`role="alert"` en errores de formularios,
      labels ausentes en varios inputs.
- [ ] Página `/gracias/*` indexable en sitemap pese a bloqueo en robots.txt.
- [ ] Holded retry delay mal calculado (bug de índice de array) — 3er intento
      espera 60 min en vez de 15. `app/api/cron/holded-sync/route.ts:13-17`
- [ ] Fiscal reminders no usa `enqueueEmail()` (llama a Resend directo) → sin
      idempotencia real ante timeouts.

## 4. Revisión de flujos de correo (formularios + OAuth login)

Hallazgos de la investigación — no todo son bugs, pero documentar para decidir:

- Todos los formularios públicos (quotes, holded-demo, presupuesto-avanzado,
  contacto) usan `sendEmail()` directo (no `enqueueEmail()`), cada uno con
  confirmación al usuario + notificación a admin. Correcto en general.
- **Gap confirmado:** viabilidad no notifica al equipo, solo al cliente.
- **Gap confirmado:** reseñas no confirman recepción al cliente.
- OAuth de usuario (Google/Azure vía Supabase `signInWithOAuth`) es login real de
  cliente — separado correctamente de "Gmail OAuth" (`/api/auth/google-gmail`),
  que es una función solo-staff (admin/owner) para enviar correos desde su propia
  cuenta de Gmail. No están mezclados, es una separación correcta.
- Email de bienvenida se envía en `app/auth/callback/route.ts:77-89` tras el
  primer login OAuth (flag `welcome_email_sent`), no en el trigger SQL — permite
  manejo de errores sin bloquear el login. Correcto.
- **Acción:** cerrar los dos gaps (viabilidad admin email, confirmación de reseña);
  el resto de la arquitectura de email está bien diseñada, no requiere refactor.

## 5. Kia — arquitectura y configuración (resumen para referencia)

- 24 archivos en `lib/ai/kia/` + `health/` + `prompts/`. Motor de decisión con
  loop agéntico (máx. 5 iteraciones, timeout 25s), guardas de política, validador
  GPT-4o "judge" fail-open, anti-repetición, sub-agentes por dominio (fiscal,
  Holded, expediente).
- Multi-proveedor (Anthropic primario, OpenAI fallback) vía `AI_PROVIDER` env var.
  Modelos: `claude-sonnet-4-6` (tareas complejas), `claude-haiku-4-5-20251001`
  (tareas ligeras). Todo hardcodeado o por env var — **no hay UI de admin para
  ajustar modelo/temperatura/prompts sin redeploy**.
- Ejecución de herramientas **deshabilitada por defecto** (`KIA_AI_TOOLS_ENABLED`).
- Cost tracking existe (`kia-cost-tracker.ts`) y se ve en `/admin/kia-health`, pero
  **sin alertas ni límites automáticos** — de ahí el crítico #6 de la sección 1.
- Paneles admin ya existentes: `/admin/kia-health`, `/admin/kia-metrics`,
  `/admin/kia-auditor`. Sirven para observar, no para configurar.
- **No se requiere cambio arquitectónico** salvo: sanitizar `pageData` (crítico #2)
  y añadir rate limiting/cuota (crítico #6). El resto del diseño es sólido.

---

## Orden de implementación acordado

1. **Fase 1 (ahora):** los 6 críticos de la sección 1.
2. **Fase 2:** altos de WABA + Holded sync + email queue race conditions.
3. **Fase 3:** gaps de email (viabilidad admin, confirmación reseña) + medios de
   seguridad (JWT secret, aislamiento de tenant en reportes).
4. **Fase 4:** accesibilidad, SEO, limpieza menor.

Marcar cada casilla al completarla y hacer commit incremental por fase.
