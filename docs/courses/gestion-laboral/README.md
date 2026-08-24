# Curso de Gestión Laboral Integral

Paquete de especificación y contenidos para implementar en `expertconsulting.es` el programa de formación personalizada en gestión laboral. Especificación original: PR #20 (rama `codex/gestion-laboral-course-spec`), implementada en fases sobre `claude/academy-gestion-laboral` siguiendo el mismo enfoque por fases que `docs/business-academy-implementation-plan.md`.

## Estado de implementación

**Fase 1 — landing pública, pago, PDF, leads: implementada.**

- `lib/data/academy-catalog.ts` — segundo programa `gestion-laboral-integral` añadido al array `academyPrograms`.
- `app/(public)/academy/[slug]/page.tsx` — ruta dinámica que sirve `/academy/gestion-laboral-integral` sin sustituir el Programa Superior.
- CTA de pago conectado al Payment Link aprobado, sin reutilizar el Price ID del Programa Superior.
- `app/(public)/gracias/academy/gestion-laboral-integral/page.tsx` — página de éxito para configurar en Stripe.
- PDF corporativo genérico publicado sin datos personalizados de clientes.
- Formulario de leads y reserva de reunión reutilizan los componentes genéricos existentes.
- Sitemap y contexto de Kia actualizados para distinguir ambos programas.

**Fase 2 — contenidos terminados; integración web y validación funcional pendientes:**

- servir `/docs/laboral` con control de acceso público/alumno verificado en servidor;
- conectar el Payment Link con `academy_enrollments` mediante webhook o migrar a checkout interno;
- incorporar analítica de conversión;
- añadir JSON-LD `Course`, `Offer`, `Organization` y `BreadcrumbList`.

Los manuales 01–08 ya están redactados como SOPs y los artículos 10–16 cubren
el mapa de herramientas y las rutas específicas. Todos permanecen en `review`
hasta realizar las 58 capturas previstas y ejecutar las pruebas de extremo a
extremo en cuentas autorizadas.

Esta actualización amplía los contenidos fuente, la programación por plataformas y el dossier descargable, sin alterar el código de la Fase 1.

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

Las versiones personalizadas contienen datos de cliente y no deben publicarse como descarga general.

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
