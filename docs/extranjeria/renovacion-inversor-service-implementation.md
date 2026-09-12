# Implementación pública: servicio de renovación residencia inversor

Estado: plan de implementación editorial/técnica  
No aplica DDL. No modifica pagos ni Stripe.  
Rama: `docs/inversor-sl-persona-juridica`

## Objetivo

Crear una ficha pública específica para la renovación de residencia de inversor Ley 14/2013 en régimen transitorio y enlazarla con:

- guía base general de renovación;
- guía específica de inmuebles a través de persona jurídica;
- artículo blog actualizado sobre renovación tras eliminación de golden visa.

## Problema actual detectado

Existe artículo de blog antiguo relacionado con inversores y golden visa:

- `permiso-residencia-inversores`
- `relatedServiceSlugs: ['inversores']`

Debe revisarse porque, tras la eliminación de nuevas solicitudes inmobiliarias, el contenido comercial principal debe girar hacia:

- renovaciones de autorizaciones vigentes;
- régimen transitorio;
- casos de inversión inmobiliaria;
- inversiones canalizadas por persona jurídica.

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

Precio recomendado:

```ts
Consultar
```

Motivo: no fijar precio cerrado todavía porque los expedientes pueden variar mucho según:

- titular persona física;
- familiares;
- inmuebles múltiples;
- SL española;
- sociedad extranjera;
- control indirecto;
- necesidad de informe PRIE;
- antecedentes penales por ausencias;
- cambios de titularidad.

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
    'Preparamos y presentamos la renovación de residencia de inversor Ley 14/2013. Revisión de inversión inmobiliaria, SL, familiares, medios económicos, seguro y tasas UGE.',
  description:
    'Gestionamos la renovación de autorizaciones de residencia de inversor concedidas al amparo de la Ley 14/2013 cuando siguen siendo renovables por régimen transitorio. Revisamos la autorización inicial, el mantenimiento de la inversión, los medios económicos, el seguro médico, las ausencias y la documentación de familiares. En inversiones inmobiliarias canalizadas a través de sociedad mercantil, revisamos también la estructura societaria y la necesidad de informe de persona jurídica ante el PRIE.',
  price: 'Consultar',
  duration: '10–20 días hábiles de preparación, según documentación',
  officialFee: 'Tasa 790 código 038 no incluida. Tasa 790 código 012 posterior para TIE no incluida.',
  servicePriceDetail:
    'Honorarios según complejidad del expediente: titular individual, familiares, inversión directa o inversión mediante sociedad mercantil.',
  checkoutLegal:
    'Servicio sujeto a revisión previa de viabilidad. Las tasas administrativas, notas simples, traducciones, apostillas e informes externos no están incluidos salvo pacto expreso.',
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
    'Revisión de inversión inmobiliaria y notas simples.',
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
    'Informe externo PRIE o certificados de inversiones, si tienen coste o gestión específica.',
    'Traducciones juradas, apostillas o legalizaciones.',
    'Recursos administrativos o judiciales en caso de denegación.'
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

1. Confirmar precio comercial.
2. Confirmar si habrá checkout o solo solicitar presupuesto.
3. Crear `stripePriceId` solo si se decide precio cerrado.
4. Si el precio queda como `Consultar`, no añadir `stripePriceId`.
5. Revisar y actualizar el artículo antiguo `permiso-residencia-inversores` para no mantener copy obsoleto sobre nuevas golden visa inmobiliarias.
6. Añadir relación en `lib/utils/docs.ts` y `lib/utils/blog.ts` cuando se haga el cambio activo.
