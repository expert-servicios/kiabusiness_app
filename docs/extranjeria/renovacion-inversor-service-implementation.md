# Implementación pública: servicio de renovación residencia inversor

Estado: plan de implementación editorial/técnica  
No aplica DDL. No modifica pagos ni Stripe.  
Rama: `docs/inversor-sl-persona-juridica`

## Objetivo

Crear una ficha pública específica para la renovación de residencia de inversor Ley 14/2013 en régimen transitorio y enlazarla con:

- guía base general de renovación;
- guía específica de inmuebles a través de persona jurídica;
- artículo blog actualizado sobre renovación tras eliminación de golden visa.

## Precio comercial confirmado

Honorarios profesionales:

- Titular inversor: 250 € + IVA.
- Cada familiar adicional: 90 € + IVA.

Costes externos no incluidos:

- Tasa administrativa 790 código 038.
- Tasa posterior 790 código 012 para TIE.
- Notas simples del Registro de la Propiedad.
- Certificaciones mercantiles.
- Certificados bancarios, registrales o administrativos.
- Informe PRIE / persona jurídica, si requiere gestión específica o costes externos.
- Traducciones juradas.
- Apostillas o legalizaciones.
- Antecedentes penales extranjeros.
- Recursos, subsanaciones complejas o requerimientos no previsibles.

## Estado actual detectado

### Catálogo público

No se ha detectado todavía una ficha activa específica con slug:

```ts
renovacion-residencia-inversor
```

Existe una ficha genérica de renovación de residencia (`renovacion-residencia`) y contenido antiguo de blog sobre inversores/golden visa, pero no una landing específica para renovación de inversor Ley 14/2013 en régimen transitorio.

### Stripe

Revisión realizada en cuenta live `Expert Consulting`:

- No hay price activo con `metadata.service_slug = renovacion-residencia-inversor`.
- No hay price activo con `metadata.service_slug = inversores`.
- No hay price activo con `metadata.slug = renovacion-residencia-inversor`.
- No hay product activo encontrado por nombre `inversor`.
- No hay lookup key activo `renovacion_residencia_inversor_titular`.

Conclusión: los precios de Stripe para este nuevo servicio están pendientes de crear si se quiere checkout directo.

## Servicio propuesto en catálogo

Archivo objetivo: `lib/utils/catalog.ts`

Slug recomendado:

```ts
renovacion-residencia-inversor
```

Categoría:

```ts
extranjeria-nacionalidad
```

Precio visible recomendado:

```ts
Desde 250 € + IVA
```

Detalle de precio:

```ts
Titular inversor: 250 € + IVA. Familiar adicional: 90 € + IVA por persona. Tasas, certificados, notas simples, traducciones, apostillas, informes oficiales y otros costes externos no incluidos.
```

## Stripe pendiente

Si se publica con checkout directo, crear dos prices de pago único:

1. `renovacion_residencia_inversor_titular`
   - Importe: 250,00 € + IVA.
   - Tipo: one-time service.
   - Metadata recomendada:
     - `service_slug=renovacion-residencia-inversor`
     - `role=titular`

2. `renovacion_residencia_inversor_familiar`
   - Importe: 90,00 € + IVA.
   - Tipo: one-time service.
   - Metadata recomendada:
     - `service_slug=renovacion-residencia-inversor`
     - `role=familiar`

Riesgo funcional: el checkout actual de catálogo está pensado para un precio principal por servicio. Si se quiere cobrar titular + N familiares desde una sola landing, hay que decidir si:

- se crea checkout manual desde admin;
- se usa carrito con unidades;
- se crea producto separado para familiar;
- se deja la landing con CTA de presupuesto/consulta y se cobra manualmente.

## Objeto Service propuesto

```ts
{
  slug: 'renovacion-residencia-inversor',
  categoria: 'extranjeria-nacionalidad',
  name: 'Renovación de residencia de inversor',
  shortDescription:
    'Renovación de autorizaciones de residencia de inversor Ley 14/2013 en régimen transitorio, con revisión de inversión, medios económicos, seguro y familiares.',
  metaTitle: 'Renovación residencia inversor Ley 14/2013 · EXPERT Asesoría',
  metaDescription:
    'Preparamos y presentamos la renovación de residencia de inversor Ley 14/2013. Titular desde 250 € + IVA y familiares desde 90 € + IVA por persona. Tasas y certificados no incluidos.',
  description:
    'Gestionamos la renovación de autorizaciones de residencia de inversor concedidas al amparo de la Ley 14/2013 cuando siguen siendo renovables por régimen transitorio. Revisamos la autorización inicial, el mantenimiento de la inversión, los medios económicos, el seguro médico, las ausencias y la documentación de familiares. En inversiones inmobiliarias canalizadas a través de sociedad mercantil, revisamos también la estructura societaria y la necesidad de informe de persona jurídica ante el PRIE.',
  price: 'Desde 250 € + IVA',
  duration: '10–20 días hábiles de preparación, según documentación',
  officialFee: 'Tasa 790 código 038 no incluida. Tasa 790 código 012 posterior para TIE no incluida.',
  servicePriceDetail:
    'Titular inversor: 250 € + IVA. Familiar adicional: 90 € + IVA por persona. Tasas, notas simples, certificados, traducciones, apostillas e informes oficiales no incluidos.',
  checkoutLabel: 'Solicitar revisión del expediente',
  checkoutLegal:
    'El precio cubre honorarios profesionales. Tasas administrativas, notas simples, certificaciones, traducciones, apostillas, informes oficiales y otros costes externos se pagan aparte.',
  keyPoints: [
    {
      title: 'Régimen transitorio',
      text: 'Tras la eliminación de nuevas golden visa inmobiliarias, las autorizaciones vigentes pueden renovarse si se mantienen los requisitos que dieron lugar a la autorización inicial.'
    },
    {
      title: 'Inversión mantenida',
      text: 'El expediente debe acreditar que la inversión inmobiliaria sigue existiendo y que el importe mínimo exigido continúa cubierto, libre de cargas en la parte computable.'
    },
    {
      title: 'Sociedades mercantiles',
      text: 'Si la inversión está en una SL u otra persona jurídica, debe acreditarse el control societario del solicitante y puede ser necesario informe oficial de persona jurídica.'
    }
  ],
  audience: [
    'Titulares de autorización de residencia de inversor Ley 14/2013 vigente o próxima a caducar.',
    'Familiares de titulares inversores que deben renovar conjuntamente.',
    'Inversores con inmuebles en España que conservan la inversión inicial.',
    'Inversores cuya inversión inmobiliaria está canalizada mediante una sociedad mercantil.',
    'Clientes que necesitan revisar si su expediente entra en el régimen transitorio tras la eliminación de la golden visa inmobiliaria.'
  ],
  requirements: [
    'Autorización de residencia de inversor vigente o en plazo de renovación.',
    'Mantenimiento de la inversión que justificó la autorización inicial.',
    'Seguro médico vigente.',
    'Medios económicos suficientes.',
    'Pasaporte y TIE vigentes.',
    'Documentación de familiares, si se renuevan autorizaciones dependientes.'
  ],
  includes: [
    'Revisión de viabilidad del régimen transitorio.',
    'Checklist documental individual del titular y familiares.',
    'Revisión de inversión inmobiliaria y notas simples aportadas.',
    'Revisión básica de medios económicos y seguro médico.',
    'Preparación de solicitud de renovación ante UGE.',
    'Instrucciones para tasas 790 código 038.',
    'Presentación telemática, si procede.',
    'Orientación para TIE posterior tras resolución favorable.'
  ],
  documents: [
    {
      title: 'Titular inversor',
      items: [
        'Solicitud de renovación Ley 14/2013.',
        'Pasaporte completo en vigor.',
        'TIE actual por ambas caras.',
        'Tasa 790 código 038.',
        'Seguro médico vigente.',
        'Medios económicos suficientes.',
        'Documentación de mantenimiento de la inversión.',
        'Antecedentes penales si procede por ausencias superiores a seis meses.'
      ]
    },
    {
      title: 'Familiares',
      items: [
        'Solicitud individual de cada familiar.',
        'Pasaporte completo y TIE actual.',
        'Tasa 790 código 038 por cada familiar.',
        'Seguro médico.',
        'Vínculo familiar y dependencia cuando proceda.',
        'Certificado escolar para menores si corresponde.'
      ]
    },
    {
      title: 'Inversión inmobiliaria',
      items: [
        'Notas simples o certificaciones de dominio y cargas recientes.',
        'Escrituras de compraventa si hace falta acreditar valor.',
        'Documentación de cargas hipotecarias, si existen.',
        'Cuadro resumen de inmuebles, valores y cargas.'
      ]
    },
    {
      title: 'Persona jurídica / SL',
      items: [
        'NIF de la sociedad.',
        'Escritura de constitución y estatutos vigentes.',
        'Nota simple mercantil o certificación registral.',
        'Certificado de socios, participaciones y derechos de voto.',
        'Documentación que acredite facultad de nombrar o destituir administradores.',
        'Informe oficial de persona jurídica cuando proceda.'
      ]
    }
  ],
  process: [
    { title: 'Revisión inicial', text: 'Analizamos la autorización inicial, fecha de caducidad, forma de inversión y régimen transitorio aplicable.' },
    { title: 'Checklist documental', text: 'Preparamos la lista concreta para titular, familiares, inmuebles y, en su caso, sociedad mercantil.' },
    { title: 'Preparación del expediente', text: 'Revisamos documentos, tasas, formularios, inversión, seguro y medios económicos.' },
    { title: 'Presentación ante UGE', text: 'Presentamos telemáticamente cuando el expediente es viable y la documentación está completa.' },
    { title: 'Resolución y TIE', text: 'Tras la concesión, orientamos sobre tasa 012, cita de huellas y documentación para la nueva tarjeta.' }
  ],
  notIncluded: [
    'Tasa 790 código 038.',
    'Tasa 790 código 012 para TIE posterior.',
    'Notas simples del Registro de la Propiedad.',
    'Certificaciones mercantiles.',
    'Certificados bancarios, registrales o administrativos.',
    'Informe externo PRIE o certificados de inversiones, si tienen coste o gestión específica.',
    'Traducciones juradas, apostillas o legalizaciones.',
    'Certificados de antecedentes penales extranjeros.',
    'Recursos administrativos o judiciales en caso de denegación.',
    'Subsanaciones complejas o requerimientos no previsibles.'
  ],
  reviewBeforeHiring: [
    'Si la autorización ya está caducada fuera de plazo.',
    'Si se vendió o sustituyó la inversión inicial.',
    'Si la inversión pasó de persona física a sociedad o viceversa tras la derogación.',
    'Si hay ausencias largas fuera de España.',
    'Si existen varios socios y ninguno tiene control societario individual claro.'
  ],
  finalCta: {
    title: '¿Necesitas renovar tu residencia de inversor?',
    text: 'Revisamos si tu autorización entra en el régimen transitorio y preparamos el expediente de renovación con la documentación correcta.'
  },
  faqs: [
    {
      q: '¿Cuánto cuesta el servicio?',
      a: 'Los honorarios son 250 € + IVA para el titular inversor y 90 € + IVA por cada familiar adicional. Tasas, certificados, notas simples, traducciones, apostillas e informes oficiales se pagan aparte.'
    },
    {
      q: '¿Se puede solicitar una nueva golden visa inmobiliaria?',
      a: 'No como solicitud ordinaria nueva tras la eliminación del régimen. Este servicio está orientado a renovaciones de autorizaciones ya concedidas y vigentes dentro del régimen transitorio.'
    },
    {
      q: '¿La renovación es automática?',
      a: 'No. Hay que acreditar que se mantienen las condiciones que justificaron la autorización inicial, especialmente inversión, medios económicos y seguro médico.'
    },
    {
      q: '¿Qué pasa si la inversión está en una SL?',
      a: 'Debe acreditarse que la sociedad conserva los inmuebles y que el solicitante extranjero conserva el control societario exigido. Puede ser necesario informe oficial de persona jurídica.'
    },
    {
      q: '¿Puedo renovar también a mi familia?',
      a: 'Sí, si los familiares mantienen su condición de dependientes o familiares autorizados y se aporta expediente individual para cada uno.'
    }
  ]
}
```

## Artículos y docs relacionados

Para `relatedServiceSlugs`, actualizar cuando se publique el servicio:

- Blog actual `permiso-residencia-inversores`: revisar o redirigir enfoque a régimen transitorio.
- Blog draft nuevo: `renovar-residencia-inversor-inmuebles-sl-2026`.
- Docs nuevo: `renovacion-residencia-inversor-ley-14-2013`.
- Docs subtipo: `renovacion-inversor-inmuebles-persona-juridica`.

## Criterios antes de tocar código activo

1. Confirmar si habrá checkout directo o contratación manual.
2. Si hay checkout directo, crear prices Stripe para titular y familiar.
3. Definir cómo se añadirá el número de familiares al carrito.
4. Revisar y actualizar el artículo antiguo `permiso-residencia-inversores` para no mantener copy obsoleto sobre nuevas golden visa inmobiliarias.
5. Añadir relación en `lib/utils/docs.ts` y `lib/utils/blog.ts` cuando se haga el cambio activo.