# Curso de Gestión Laboral Integral

Paquete de especificación y contenidos para implementar en `expertconsulting.es` el programa de formación personalizada en gestión laboral. Especificación original: PR #20 (rama `codex/gestion-laboral-course-spec`), implementada en fases sobre `claude/academy-gestion-laboral` siguiendo el mismo enfoque por fases que `docs/business-academy-implementation-plan.md`.

## Estado de implementación

**Fase 1 — landing pública, pago, PDF, leads: implementada.**

- `lib/data/academy-catalog.ts` — segundo programa `gestion-laboral-integral` añadido al array `academyPrograms` (interfaces `AcademyProgram`/`AcademyOfficialCertification` ampliadas con campos opcionales: `hoursTutoring`, `valueLabel`, `taxNote`, `paymentLink`, `downloadHref`, `tutoringIncluded`; `officialCertification`, `finalProject` y `targetProfiles` pasan a opcionales porque este curso no los tiene).
- `app/(public)/academy/[slug]/page.tsx` — nueva ruta dinámica para programas distintos del índice 0, para no tocar ni duplicar `/academy` (que sigue sirviendo el Programa Superior sin cambios). Sirve `/academy/gestion-laboral-integral`.
- CTA de pago **"Inscribirme y pagar"** enlaza directo al Payment Link de Stripe aprobado (`paymentLink` en el catálogo) — NO usa `/api/academy/checkout` ni un `stripePriceId`, tal como exige `STRIPE_AND_CONVERSION.md` ("no crear un Price ID ficticio", "no reutilizar el del Programa Superior").
- `app/(public)/gracias/academy/gestion-laboral-integral/page.tsx` — página de éxito para configurar como redirect del Payment Link en el Dashboard de Stripe. No afirma matrícula activa (eso requeriría el webhook de la Fase 2).
- PDF corporativo genérico copiado desde la rama de origen a `public/downloads/academy/gestion-laboral-integral/programa-gestion-laboral-integral-expert.pdf` (26 páginas, verificado que NO es la versión personalizada de Ilya Ovchinnikov).
- Formulario de leads: reutiliza `AcademyLeadForm`/`app/api/academy/leads` sin cambios (ya son genéricos por `programSlug`).
- Reserva de reunión informativa: reutiliza `CalendlyButton`/`getCalAcademyUrl()` sin cambios (mismo slot de Cal.com que el Programa Superior).
- `app/sitemap.ts` — entrada añadida.
- Kia: `lib/ai/kia/prompts/kia-academy-knowledge.ts` ampliado con un bloque `academy_program_2` y reglas para no confundir los dos programas ni prometer la exención de IVA como garantizada. `ACADEMY_CONTEXT_RE` (system prompt) e `includeAcademy` (decision engine) amplían sus regex.

**Fase 2a — base de conocimientos `/docs/laboral`: implementada.**

- `lib/utils/academy-knowledge.ts` — cargador de contenido: lee `content/academy/gestion-laboral/knowledge/*.md` con `fs.readdirSync`/`readFileSync` (ruta literal, para que el file-tracing de Next.js/Vercel empaquete los archivos correctamente) y parsea el frontmatter (`access`, `status`, `module`, `tags`, etc.) con un parser propio minimalista, sin depender de ninguna librería nueva.
- `lib/utils/academy-enrollment.ts` — `getActiveEnrollment(programSlug)`: comprueba sesión (cookies, patrón ya usado en `/gracias/pago`) y busca una fila `academy_enrollments` con `status = 'active'` para ese programa. Se ejecuta siempre en servidor — nunca se decide el acceso en el cliente.
- `app/(public)/docs/laboral/page.tsx` — índice: el manual `00-indice.md` (`access: public`) se muestra listado junto a los 8 manuales privados, marcados con candado si el visitante no tiene matrícula activa. `robots: noindex` porque la página en sí no aporta contenido propio indexable.
- `app/(public)/docs/laboral/[slug]/page.tsx` — ficha de manual. Solo el artículo público se pre-renderiza (`generateStaticParams` filtra por `access === 'public'`); los 8 manuales privados se sirven dinámicamente por request (Next.js detecta el uso de `cookies()` dentro de `getActiveEnrollment` y desactiva el cacheo estático automáticamente). Sin matrícula, el `body` del manual **nunca se envía al cliente** — se renderiza una pantalla de bloqueo en su lugar, no solo se oculta con CSS/JS.
- `components/docs/AcademyKnowledgeArticle.tsx` — renderer de markdown reutilizando el mismo patrón ya usado en `/docs/[slug]` (duplicado, no refactorizado desde el original, para no tocar la página pública de docs ya en producción).
- CTA **"Explorar manuales"** añadido a la landing del curso (`knowledgeBaseHref` nuevo en el catálogo).
- Kia (`kia-academy-knowledge.ts`) actualizada: sabe que solo el índice es público y nunca debe insinuar que alguien sin matrícula puede ver los manuales completos.
- `app/sitemap.ts` — solo se añade `/docs/laboral/indice` (el único contenido realmente público); el índice y los manuales privados quedan fuera del sitemap.

**Fase 2b — webhook de matrícula: implementada, con un paso manual pendiente en Stripe.**

`app/api/stripe/webhook/route.ts` (bloque `product_type === 'academy_program'`) ya reacciona a pagos del Payment Link externo, no solo a los de `/api/academy/checkout`:

- Si la sesión trae `client_reference_id`/`metadata.user_id` (checkout interno) se usa directamente.
- Si no (compra por Payment Link, que deliberadamente no exige login antes de pagar), se busca un `profiles` existente por el email de la compra. Si hay coincidencia, se crea la fila `academy_enrollments` automáticamente — el comprador recibe acceso a los manuales sin intervención manual.
- Si no hay ninguna cuenta con ese email, se registra igualmente el pago en `orders` (para no perder trazabilidad ni duplicar el email en reintentos del webhook de Stripe) y se envían dos emails nuevos: al comprador (`academyEnrollmentPendingLink`, pidiéndole crear cuenta/iniciar sesión con el mismo email) y a admin (`academyEnrollmentPendingLinkAdmin`, con instrucción de vincular manualmente la matrícula cuando esa persona tenga cuenta).

⚠️ **Paso manual pendiente — configurar el Payment Link en el Dashboard de Stripe:**
Para que el webhook identifique la compra como `academy_program`/`gestion-laboral-integral`, el Payment Link (`https://buy.stripe.com/6oU00kftqgMs9jU5gJ8EM0i`) necesita metadata configurada en Stripe Dashboard → Payment Links → editar este enlace → Metadata:

| Key | Value |
|---|---|
| `product_type` | `academy_program` |
| `program_slug` | `gestion-laboral-integral` |
| `program_name` | `Programa personalizado de Gestión Laboral Integral` |

Sin esta metadata, `checkout.session.completed` llega sin `product_type` y el bloque completo del webhook se salta silenciosamente (mismo comportamiento que hoy, antes de este cambio).

**Limitación conocida, aceptada por ahora:** si un comprador de Payment Link no tiene cuenta EXPERT con el mismo email de compra, la vinculación de su matrícula sigue siendo manual. Auto-vincular por email en el primer login futuro requeriría hacer `academy_enrollments.client_id` nullable + añadir una columna `client_email` — se ha dejado fuera de esta fase para no depender de otra migración de Supabase en esta sesión.

**Fase 2c — vista admin de matrículas: implementada.** `/admin/academy-matriculas` (enlace "Matrículas Academy" en el sidebar, bajo Facturación) permite hacer ese paso manual sin SQL:

- Lista los pedidos "pendientes de vincular" (compras de Payment Link cuyo email no coincidía con ninguna cuenta) con un campo para introducir el email una vez la persona se ha registrado — el botón "Vincular matrícula" crea la fila `academy_enrollments`, actualiza `orders.client_id` y envía el email de confirmación normal (`academyEnrollmentConfirmed`), reutilizando `/api/admin/academy/enrollments/link-order`.
- Lista todas las matrículas existentes con selector de `status` (activa/cancelada/completada) y, para el Programa Superior, selector de `certification_status` (sin solicitar → solicitada → en revisión → aprobada/rechazada → pagada) — la base para la Fase E de certificación oficial, aunque el checkout de esa opción sigue sin implementarse.
- Permite crear una matrícula manual (transferencia, cortesía, etc.) buscando por email de una cuenta ya existente — `/api/admin/academy/enrollments` (POST).

- Eventos de analítica (`course_view`, `course_payment_click`, etc.) — no implementados porque no existe infraestructura de analítica en el repo (`gtag`/`dataLayer`/tracker propio) a la que conectarlos.
- JSON-LD (`Course`, `Offer`, `Organization`, `BreadcrumbList`) en la landing — no implementado en esta fase.
- Estados `validated`/`pending_update` del frontmatter de los manuales (hoy todos en `draft`) — sin flujo de revisión editorial todavía; se muestran igual, sin badge de estado en la UI.

## Objetivo

Publicar un producto formativo completo que combine:

- landing comercial;
- programa descargable;
- pago seguro con Stripe;
- formulario de interés y resolución de dudas;
- reserva de entrevista informativa;
- base de conocimientos en `/docs/laboral`;
- materiales públicos y contenidos privados para alumnos;
- medición de conversión, SEO y mantenimiento editorial.

## Archivos

| Archivo | Finalidad |
| --- | --- |
| `MASTER_IMPLEMENTATION_PROMPT.md` | Prompt maestro listo para entregar a un agente de desarrollo. |
| `PRODUCT_SPEC.md` | Alcance, usuarios, contenido, rutas y criterios de aceptación. |
| `TECHNICAL_ARCHITECTURE.md` | Integración con la arquitectura Next.js actual. |
| `STRIPE_AND_CONVERSION.md` | Checkout, CTAs, leads, reuniones y eventos analíticos. |
| `CONTENT_AND_KNOWLEDGE_BASE.md` | Modelo editorial de curso y `/docs/laboral`. |
| `SEO_ANALYTICS_QA.md` | SEO, analítica, accesibilidad, seguridad y QA. |
| `IMPLEMENTATION_CHECKLIST.md` | Plan ejecutable por fases. |

## Contenidos fuente

Los textos editables del curso y los manuales se encuentran en:

```text
content/academy/gestion-laboral/
├── course.es.md
└── knowledge/
    ├── 00-indice.md
    ├── 01-configuracion-inicial.md
    ├── 02-convenio-y-tablas-salariales.md
    ├── 03-alta-y-contratacion.md
    ├── 04-nominas-mensuales.md
    ├── 05-siltra-y-cotizaciones.md
    ├── 06-variaciones.md
    ├── 07-bajas-y-finiquitos.md
    └── 08-cierre-laboral.md
```

## Activo descargable

El programa corporativo público debe servirse desde:

```text
/downloads/academy/gestion-laboral-integral/programa-gestion-laboral-integral-expert.pdf
```

La versión rusa personalizada para Ilya Ovchinnikov contiene datos de cliente y no debe publicarse como descarga general.

## Datos comerciales aprobados

- 20 horas de formación individual.
- 5 horas de tutorías y acompañamiento incluidas sin coste adicional.
- Materiales, manuales y checklists.
- Precio final: 1.200 €.
- Valor comunicado: 1.450 €.
- Pago único.
- Enlace Stripe: `https://buy.stripe.com/6oU00kftqgMs9jU5gJ8EM0i`.
- Contacto: `https://expertconsulting.es/contacto`.
- Reunión informativa: `https://expertconsulting.es/cita`.

## Regla fiscal de comunicación

No afirmar de forma absoluta que cualquier formación está exenta de IVA. Usar:

> Formación exenta de IVA cuando concurran los requisitos del artículo 20.Uno.9.º de la Ley 37/1992.

