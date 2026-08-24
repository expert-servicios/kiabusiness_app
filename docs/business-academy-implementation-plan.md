# EXPERT Business Academy — Plan de implementación

Auditoría de la estructura pública actual del sitio y propuesta de cómo lanzar
el nuevo **Programa Superior de Dirección, Administración y Gestión
Empresarial** (480h + 40h prácticas, online, ES/RU, 2.950€, certificación
oficial ADGD0210 opcional 500€+IVA) como su propia sección `/academy`.

Rama: `claude/expert-academy-implementation-plan-snu7wb`.

---

## 1. Auditoría de la estructura pública actual

El sitio tiene hoy tres modelos de venta distintos, cada uno con su propia
carpeta y patrón de datos — el curso no encaja limpiamente en ninguno:

| Patrón | Carpeta | Modelo de datos | Precio | Checkout |
|---|---|---|---|---|
| Catálogo de servicios (trámite puntual) | `app/(public)/servicios/[categoria]/[servicio]/` | `lib/utils/catalog.ts` → `Service[]` (1669 líneas, 57 servicios) | Fijo o "solicitar presupuesto" | `/api/services/checkout` (Stripe payment, precio derivado por regex del string `price`) |
| Planes de suscripción mensual/anual | `app/(public)/planes/[plan]/` | Hardcoded por página, sin catálogo central | Recurrente | `/api/subscriptions/checkout` (Stripe subscription) |
| Paquetes Holded (implantación) | `app/(public)/holded/[paquete]/` | Mismo `Service[]` de catalog.ts (categoría oculta `holded`) + ruta alternativa `/api/holded/checkout` con precios hardcodeados | Fijo | Igual que servicios |

**Conclusiones de la auditoría:**

- `catalog.ts` asume un servicio = un trámite con precio fijo o "presupuesto".
  No tiene noción de curso, módulos, duración en horas, o un add-on opcional
  (la certificación oficial de 500€+IVA) — forzarlo ahí requeriría campos que
  no tienen sentido para el resto del catálogo.
- No existe infraestructura de **i18n para páginas públicas**. El único sitio
  donde `'es' | 'ru'` ya existe es el system prompt de Kia
  (`lib/ai/kia/kia-system-prompt.ts:82`) — el sitio público es 100% español.
  El curso promete formación en ruso, no la web en ruso — son cosas distintas,
  hay que dejarlo claro en el plan para no sobre-construir.
- Captación de leads ya tiene un patrón maduro y reutilizable:
  `app/api/quotes/route.ts` (Zod schema + honeypot + rate limit + spam guard +
  reCAPTCHA + email doble cliente/admin) — el formulario "Solicitar
  información" de la Academy debe clonar este patrón, no inventar uno nuevo.
- Reservas ya tienen patrón maduro: `lib/utils/cal.ts` expone
  `getCalOnboardingUrl()`/`getCalFormacionUrl()`/etc. leyendo
  `NEXT_PUBLIC_CAL_*_LINK`. El botón "Reservar entrevista de admisión" debe
  añadir un quinto slug (`NEXT_PUBLIC_CAL_ACADEMY_LINK`) siguiendo el mismo
  helper, no una integración nueva.
- Kia (`lib/ai/kia/kia-system-prompt.ts`) inyecta conocimiento de dominio por
  regex de contexto (Holded, AEAT, SS, DGT...) — el curso necesita su propio
  bloque de conocimiento para que Kia pueda responder preguntas sobre el
  programa sin alucinar contenido.
- Blog (`app/(public)/blog/`) y base de conocimientos (`app/(public)/docs/`)
  ya existen como sistemas de contenido separados del catálogo — la Academy
  se beneficia de artículos de blog enlazados (SEO + nutrición de leads), pero
  eso es contenido editorial, no requiere cambios de arquitectura.

---

## 2. Decisión: sección propia `/academy`, no forzarlo en `/servicios` ni `/planes`

**Razones:**
1. Precio único con add-on opcional (2.950€ + 500€+IVA condicional) no es ni
   "trámite con precio fijo" ni "suscripción recurrente".
2. Contenido mucho más largo (programa de 16 módulos, requisitos de acceso a
   la certificación oficial, FAQ propia) que una ficha de servicio estándar.
3. Necesita su propio flujo de lead capture con preguntas específicas
   (puesto actual, experiencia, modalidad ES/RU) que no aplican al resto del
   catálogo.
4. Es un producto con vida propia a futuro (posibles ediciones, grupos,
   calendario) — aislarlo en su propia carpeta evita acoplar su evolución al
   catálogo de trámites.

## 3. Estructura de datos propuesta

Nuevo archivo `lib/data/academy-catalog.ts`, independiente de `catalog.ts`:

```typescript
export interface AcademyModule {
  order: number;
  title: string;
  topics: string[];
}

export interface AcademyProgram {
  slug: string;                    // 'direccion-administracion-gestion-empresarial'
  name: string;
  tagline: string;
  hoursTraining: number;           // 480
  hoursInternship: number;         // 40
  price: string;                   // '2.950 €'
  stripePriceId?: string;
  officialCertification: {
    code: string;                  // 'ADGD0210'
    name: string;
    price: string;                 // '500 € + IVA'
    stripePriceId?: string;        // add-on opcional, checkout separado
    requirementsNote: string;
  };
  audience: string[];
  outcomes: string[];
  modules: AcademyModule[];        // 16 módulos, del copy compartido
  finalProject: { description: string; options: string[] };
  methodology: string[];
  languages: ('es' | 'ru')[];
  faqs: { q: string; a: string }[];
}

export const academyPrograms: AcademyProgram[] = [ /* contenido del copy */ ];
```

## 4. Rutas propuestas

```
app/(public)/academy/
  page.tsx                          # landing general Academy (si hay 1+ programas)
  [programa]/page.tsx               # ficha del programa (usa academy-catalog.ts)
  [programa]/solicitar-info/page.tsx  # o modal, formulario dedicado
```

Para el lanzamiento (1 solo programa), `page.tsx` puede redirigir directo a
`/academy/direccion-administracion-gestion-empresarial` o servir como landing
+ ficha combinada — decisión de UX a tomar en Fase A, no bloquea el modelo de
datos.

## 5. Checkout — dos flujos separados

1. **Programa (2.950€, pago único):** reutilizar `/api/services/checkout`
   parametrizado, o clonar a `/api/academy/checkout` si el flujo de
   creación de `case`/onboarding difiere del de un trámite estándar (a
   decidir en Fase A — probablemente sí difiere, ya que un curso no abre un
   "expediente" de gestoría sino una matrícula).
2. **Certificación oficial opcional (500€+IVA):** checkout independiente,
   ofrecido *después* de la compra del programa y de verificar requisitos de
   acceso — no se vende junto en el mismo carrito. Requiere un nuevo estado
   en el perfil del alumno (`academy_enrollment.certification_requested`) y
   revisión manual admin antes de habilitar el pago (el copy es explícito:
   "Antes de contratar esta opción, EXPERT revisará individualmente la
   situación del participante").

## 6. Lead capture — clonar patrón de `/api/quotes`

Nuevo `app/api/academy/leads/route.ts`, mismo patrón que
`app/api/quotes/route.ts`:
- Zod schema con campos propios: nombre, email, teléfono, puesto actual,
  experiencia, modalidad preferida (es/ru), interés en certificación oficial.
- Honeypot + `checkRateLimit` + `checkSpam` + `verifyRecaptchaToken` (mismo
  orden que el resto de formularios, ya estandarizado en Fase 4 de la
  auditoría de seguridad).
- Dos emails: confirmación al lead + notificación a admin (nuevas plantillas
  `academyLeadReceived()` / `academyLeadReceivedAdmin()` en
  `lib/email/templates.ts`, mismo estilo que `quoteReceivedClient/Admin`).

## 7. Reservas — extender `lib/utils/cal.ts`

```typescript
export function getCalAcademyUrl(): string | null {
  return calUrl(process.env.NEXT_PUBLIC_CAL_ACADEMY_LINK);
}
```
Botón "Reservar entrevista de admisión" reutiliza `CalendlyButton`/`CalendlyModal`
existentes, sin componentes nuevos. Añadir `NEXT_PUBLIC_CAL_ACADEMY_LINK` a
`.env.example` junto a los otros 4 slugs de Cal.com.

## 8. Kia — nuevo bloque de conocimiento

Siguiendo el patrón de `kia-holded-knowledge.ts` / `kia-aeat-knowledge.ts`:
nuevo `lib/ai/kia/prompts/kia-academy-knowledge.ts` con el contenido del
programa (módulos, precio, certificación oficial, requisitos) + una regex de
contexto en `kia-system-prompt.ts` (`ACADEMY_CONTEXT_RE`) para que Kia lo
inyecte solo cuando el usuario pregunta sobre el curso — igual que el resto
de bloques de dominio, sin tocar el motor de decisión.

## 9. SEO y contenido — blog y base de conocimientos

- Artículo de blog de lanzamiento enlazando a `/academy/...` (patrón ya
  existente en `lib/utils/blog.ts` + `blogArticles`).
- Entrada en `app/sitemap.ts` para la nueva ruta (prioridad alta, ~0.85).
- `metaTitle`/`metaDescription` específicos por programa, igual que
  `Service.metaTitle` en el catálogo actual.

## 10. i18n — aclaración de alcance

El copy dice "formación disponible en español y ruso" — esto es sobre el
**idioma de impartición de las clases y tutorías**, no sobre traducir la web
pública. Para el lanzamiento, la landing puede quedar en español con una
sección explícita "Esta formación también está disponible en ruso" +
selector de idioma en el formulario de lead capture (`modalidad: 'es' | 'ru'`)
en vez de duplicar la web entera en `/ru/academy`. Traducir la web pública
completa es un proyecto aparte, fuera de alcance de este lanzamiento.

---

## Fases de implementación

- **Fase A — Landing `/academy` + menú de navegación:** `lib/data/academy-catalog.ts`
  con el contenido íntegro del programa (16 módulos, FAQ, precios, requisitos),
  página de ficha usando el layout público existente (`Header`/`Footer`),
  metadata SEO, entrada en sitemap. Nueva entrada **"Formación"** en el nav
  principal (`components/site/header.tsx`), enlace directo (no dropdown,
  solo hay 1 programa por ahora) siguiendo el mismo estilo que "Reservar cita".
- **Fase B — Lead capture + email:** `app/api/academy/leads/route.ts` +
  formulario embebido en la ficha + plantillas de email + notificación push a
  admin, siguiendo el patrón de `/api/quotes` al detalle (honeypot, rate
  limit, spam guard, reCAPTCHA, doble email cliente/admin).
- **Fase C — Reserva de entrevista de admisión:** integración Cal.com
  (`getCalAcademyUrl`, nueva env var `NEXT_PUBLIC_CAL_ACADEMY_LINK`), botón
  "Reservar entrevista de admisión" en la ficha reutilizando
  `CalendlyButton`/`CalendlyModal` existentes.
- **Fase C.2 — Descarga de la programación (PDF):** endpoint
  `app/api/academy/programa-pdf/route.ts` con `@react-pdf/renderer`
  (mismo patrón que `app/api/reports/[id]/pdf/route.ts`), genera un PDF con
  los 16 módulos, duración, precio y datos de contacto — descarga directa,
  sin gate de lead (documento promocional, no de cliente).
- **Fase D — Checkout del programa:** Stripe Price real para los 2.950€,
  flujo de pago único, matrícula del alumno (decidir si crea un `case` o una
  entidad nueva `academy_enrollments`).
- **Fase E — Certificación oficial opcional:** flujo post-matrícula con
  revisión manual admin antes de habilitar el pago de los 500€+IVA.
- **Fase F — Kia:** bloque de conocimiento del curso para que el copiloto
  pueda responder preguntas sin necesidad de que el usuario navegue la ficha
  completa.

### Estado de implementación

Fases A, B, C y C.2 implementadas y **mergeadas a `main`** (desplegadas en
producción). Landing completa, nav, formulario de contacto con lead capture,
botón de reserva de entrevista, descarga de PDF de la programación.

**Enlace en vivo para la oferta comercial** (formulario de solicitud de
información, NO de compra):

```
https://expertconsulting.es/academy#solicitar-info
```

**Fase D — checkout del programa: implementada.**

- Stripe Price real del programa creado por el usuario:
  `price_1U80bxLeYwwgvux4wMUqsf7h` (2.950 €, pago único) — conectado en
  `lib/data/academy-catalog.ts` (`stripePriceId`).
- Stripe Price real de la certificación oficial creado:
  `price_1U80fDLeYwwgvux48ZV4MWyp` (500 € + IVA) — guardado en el catálogo
  pero **sin checkout público expuesto todavía** (ver Fase E).
- `app/api/academy/checkout/route.ts` — mismo patrón que
  `/api/services/checkout` (login obligatorio, perfil completo obligatorio,
  Stripe Checkout Session en modo `payment` usando el `price` real de
  Stripe directamente, `automatic_tax`, recogida de dirección e IVA).
- Modelo de matrícula: **entidad nueva `academy_enrollments`**, tal como se
  recomendaba en la sección 5 — migración
  `supabase/migrations/20260721000001_academy_enrollments.sql`. Guarda
  `program_slug`, `amount_eur`, `stripe_payment_id`, `status` y el estado de
  la certificación oficial (`certification_status`) para cuando se
  implemente la Fase E. También amplía el `check` de `orders.source` para
  aceptar `'academy'`, porque el webhook sigue insertando en `orders` en
  paralelo (consistencia financiera con el resto del catálogo — reporting,
  paneles admin existentes).
- `app/api/stripe/webhook/route.ts` — nuevo bloque para
  `product_type === 'academy_program'`: inserta en `orders` +
  `academy_enrollments` (idempotente por `stripe_payment_id`), envía email
  de confirmación al alumno y notificación a admin (email + push).
- Botón **"Matricularme ahora"** (`AcademyCheckoutButton`) añadido en la
  sección de precio de `/academy` — redirige a login si no hay sesión, a
  completar perfil si falta, o a Stripe Checkout.

  ⚠️ **Pendiente de aplicar en Supabase:** la migración
  `20260721000001_academy_enrollments.sql` está escrita pero no se ha podido
  aplicar automáticamente en esta sesión (sin acceso autenticado al MCP de
  Supabase). Debe aplicarse manualmente (SQL Editor o `supabase db push`)
  antes de que el checkout funcione en producción — si no, el webhook
  fallará al intentar insertar en `academy_enrollments` (tabla inexistente).

- [ ] **Fase E — certificación oficial opcional.** El Stripe Price ya existe
      (`price_1U80fDLeYwwgvux48ZV4MWyp`) pero deliberadamente no se expone
      ningún botón de checkout público para ella todavía, porque el negocio
      exige revisión manual de requisitos de acceso antes de cobrar. Falta:
      vista admin para marcar `certification_status` = `approved` en un
      `academy_enrollment`, y solo entonces generar un enlace de pago (Stripe
      Payment Link o checkout ad-hoc) para ese alumno concreto.
- [ ] Fase F: bloque de conocimiento de Kia sobre el curso — no bloqueante,
      puede hacerse en paralelo en cualquier momento.
