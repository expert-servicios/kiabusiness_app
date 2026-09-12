# Plantilla pública para páginas de servicios puntuales

Estado: directriz de diseño y producto  
Fecha: 12/09/2026  
Ámbito: páginas públicas de servicios en `app/(public)/servicios/[categoria]/[servicio]/page.tsx` y futuras landings específicas de servicios puntuales.

## Objetivo

Todas las páginas de servicios puntuales deben seguir un patrón común para que el usuario pueda elegir con claridad entre:

1. contratar o solicitar el servicio completo;
2. pedir presupuesto si el caso es complejo;
3. hacerlo por su cuenta con formación one to one;
4. reservar una reunión informativa gratuita de 15 minutos.

El patrón evita crear páginas aisladas con CTAs distintos, precios poco claros o flujos de contratación incompatibles con el panel de administración.

## Principios de diseño

- Usar estructura clara y repetible.
- Separar servicio completo, caso complejo, formación guiada y reunión gratuita.
- No forzar checkout directo cuando el precio depende de variables del expediente.
- Usar Stripe directo solo cuando el servicio tenga precio cerrado y `stripePriceId` seguro.
- Para casos variables, usar solicitud/revisión y cotización admin personalizada.
- Mantener tono profesional, concreto y orientado a decisión.
- Mantener enlaces a fuentes oficiales, blog y base de conocimientos cuando existan.
- Usar Cal.com para reuniones. No usar naming anterior en páginas nuevas.

## Estructura obligatoria de página

### 1. Hero

Debe incluir:

- enlace de vuelta a la categoría;
- etiqueta o contexto del servicio cuando proceda;
- `h1` con nombre del servicio;
- descripción breve;
- duración si está definida;
- CTAs principales.

CTAs de hero:

- Servicio completo:
  - si existe `stripePriceId`: botón de cesta / checkout;
  - si no existe `stripePriceId`: botón `Solicitar presupuesto`.
- Caso complejo.
- Hazlo por tu cuenta.
- Reunión gratuita 15 min.

Formato de enlaces:

```text
/solicitar-presupuesto?servicio=<slug>
/solicitar-presupuesto?servicio=<slug>&tipo=caso-complejo
/solicitar-presupuesto?servicio=formacion-one-to-one-2h&origen=<slug>
```

El formulario de presupuesto debe conservar el contexto recibido por query string:

- `servicio`: servicio principal solicitado;
- `tipo`: variante comercial, por ejemplo `caso-complejo`;
- `origen`: servicio desde el que se ofrece la formación one to one.

Ese contexto debe verse en pantalla y enviarse dentro de la descripción de la solicitud para que administración pueda identificar correctamente el origen de cada lead.

La reunión gratuita debe usar:

```ts
CalButton + getCalMeetingUrl()
```

con fallback:

```text
/contacto
```

### 2. Sidebar de conversión

El sidebar debe repetir las opciones principales para mantener conversión durante el scroll:

- precio o indicación `Consultar`;
- servicio completo / cesta / presupuesto;
- caso complejo;
- hazlo por tu cuenta;
- reunión gratuita 15 min;
- WhatsApp.

### 3. Bloque central `Elegir vía`

Toda página de servicio debe incluir un bloque central con cuatro tarjetas:

1. **Servicio completo**
   - Para contratar el trámite o solicitar revisión del expediente.
2. **Caso complejo**
   - Para incidencias, documentación incompleta, urgencias, requerimientos o estructuras no estándar.
3. **Hazlo por tu cuenta**
   - Formación one to one de 2 horas para preparar el trámite con checklist, revisión guiada y soporte humano.
4. **Reunión gratuita**
   - Reunión informativa de 15 minutos para ubicar el caso antes de decidir la vía.

Este bloque debe situarse después de la documentación/proceso principal y antes de artículos relacionados o CTA final.

## Reglas comerciales

### Servicio completo

Usar checkout/cesta solo si:

- el precio es cerrado;
- el alcance está definido;
- existe `stripePriceId` correcto;
- no hay variables relevantes que puedan cambiar el importe.

Si el servicio depende de número de personas, familiares, inmuebles, sociedades, certificados, urgencias o informes oficiales, no conectar checkout directo desde la landing salvo que exista un selector específico y validado.

### Caso complejo

Debe ofrecerse siempre porque permite filtrar expedientes no estándar.

Ejemplos de caso complejo:

- documentación incompleta;
- plazos vencidos o urgentes;
- requerimientos previos;
- sociedades, inmuebles o familiares múltiples;
- antecedentes, ausencias o incidencias administrativas;
- trámites que requieren informe externo u organismo adicional.

### Hazlo por tu cuenta

Debe enlazar a formación one to one de 2 horas:

```text
/solicitar-presupuesto?servicio=formacion-one-to-one-2h&origen=<slug>
```

La promesa comercial debe ser limitada:

- explicar el trámite;
- revisar checklist;
- guiar la preparación;
- resolver dudas prácticas;
- acompañar al cliente para que pueda presentar por su cuenta.

No debe prometer resultado administrativo ni sustitución del servicio completo.

### Reunión gratuita de 15 minutos

Debe describirse como reunión informativa/orientativa para ubicar el caso.

No debe prometer:

- revisión completa de expediente;
- análisis jurídico-fiscal profundo;
- resolución de dudas complejas;
- preparación documental.

La herramienta oficial de reservas es Cal.com.

## Reglas de contenido del catálogo

Cada servicio nuevo en `lib/utils/catalog.ts` debe rellenar, siempre que sea posible:

- `slug`
- `categoria`
- `name`
- `shortDescription`
- `description`
- `metaTitle`
- `metaDescription`
- `price`
- `duration`
- `officialFee`
- `servicePriceDetail`
- `checkoutLegal`
- `audience`
- `requirements`
- `keyPoints`
- `includes`
- `documents`
- `process`
- `notIncluded`
- `reviewBeforeHiring`
- `finalCta`
- `faqs`

Solo añadir `stripePriceId` cuando el precio sea cerrado y el checkout esté validado.

## Blog y base de conocimientos

Cuando exista contenido relacionado:

- vincular artículos mediante `relatedServiceSlugs` en `lib/utils/blog.ts`;
- vincular guías mediante `relatedServiceSlugs` en `lib/utils/docs.ts`;
- incluir al menos 3 artículos relacionados si el servicio tiene suficiente contexto SEO;
- incluir guías de base de conocimientos cuando ayuden al usuario a decidir.

No inventar enlaces. Si todavía no existe contenido relacionado, crear borrador editorial o dejar documentado como pendiente.

## Fuentes oficiales

En servicios jurídicos, fiscales, extranjería, Seguridad Social, AEAT, registros o administración pública:

- usar fuentes oficiales;
- enlazar BOE, AEAT, Seguridad Social, ministerios, sedes electrónicas u organismos competentes;
- no basar la página en blogs externos;
- revisar cambios normativos antes de publicar.

## Diseño visual

Mantener el sistema visual actual:

- fondo principal `#F8F6F1`;
- azul marca `#0D1B2A`;
- dorado `#D4A017`;
- tarjetas blancas o azul oscuro según bloque;
- bordes suaves y jerarquía clara;
- CTAs visibles sin saturar.

El hero debe ser oscuro y sobrio. El bloque `Elegir vía` puede usar fondo azul oscuro para destacar decisión.

## Patrón técnico actual

Archivo principal:

```text
app/(public)/servicios/[categoria]/[servicio]/page.tsx
```

Helpers/componentes relevantes:

```ts
AddToCartButton
ViabilityButton
CalButton
getCalMeetingUrl
getDocsForService
getArticlesForService
getService
getServicesByCategory
```

Variables construidas en página:

```ts
const encodedServiceSlug = encodeURIComponent(service.slug);
const budgetHref = `/solicitar-presupuesto?servicio=${encodedServiceSlug}`;
const complexBudgetHref = `${budgetHref}&tipo=caso-complejo`;
const selfGuidedHref = `/solicitar-presupuesto?servicio=formacion-one-to-one-2h&origen=${encodedServiceSlug}`;
```

## Checklist antes de publicar un servicio nuevo

- [ ] El slug está definido y no se duplica.
- [ ] La categoría existe.
- [ ] El precio está claro: cerrado, desde, consultar o presupuesto.
- [ ] Si hay `stripePriceId`, el precio de Stripe existe y corresponde al servicio.
- [ ] Los costes externos están claramente excluidos si procede.
- [ ] Hay `checkoutLegal` si el precio puede generar confusión.
- [ ] Hay documentación mínima y proceso.
- [ ] Se ha añadido `notIncluded` y `reviewBeforeHiring` si el trámite tiene riesgos.
- [ ] Hay CTA de caso complejo.
- [ ] Hay CTA de formación one to one.
- [ ] Hay CTA de reunión gratuita con Cal.com.
- [ ] El formulario de presupuesto conserva `servicio`, `tipo` y `origen` cuando el CTA usa query string.
- [ ] Hay fuentes oficiales cuando procede.
- [ ] Hay artículos/docs relacionados o queda documentado como pendiente.
- [ ] Se revisa build de Vercel antes de marcar PR como listo.

## Decisión final

La plantilla común es obligatoria para nuevas páginas de servicios puntuales, salvo que exista una razón de producto documentada para crear una landing específica. Incluso en landings específicas, deben conservarse las cuatro vías de decisión:

- servicio completo;
- caso complejo;
- hazlo por tu cuenta;
- reunión gratuita.
