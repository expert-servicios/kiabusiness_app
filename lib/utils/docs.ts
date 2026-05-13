import type { CategorySlug } from './catalog';

export type DocCategorySlug = 'extranjeria-nacionalidad' | 'fiscalidad' | 'empresas' | 'tramites' | 'holded';

export type KnowledgeDoc = {
  slug: string;
  category: DocCategorySlug;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  readTime: string;
  relatedServiceSlugs?: string[];
  relatedServiceCategories?: CategorySlug[];
  seoTitle?: string;
  seoDescription?: string;
  body: string;
};

export const docCategories: { slug: DocCategorySlug; name: string }[] = [
  { slug: 'extranjeria-nacionalidad', name: 'Extranjería y Nacionalidad' },
  { slug: 'fiscalidad', name: 'Fiscalidad' },
  { slug: 'empresas', name: 'Empresas y Autónomos' },
  { slug: 'tramites', name: 'Trámites' },
  { slug: 'holded', name: 'Holded' }
];

export const docs: KnowledgeDoc[] = [
  {
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    category: 'extranjeria-nacionalidad',
    title: 'Nacionalidad española para menor nacido en España',
    excerpt:
      'Guía completa para familias extranjeras que quieren solicitar la nacionalidad española por residencia para un menor nacido en España.',
    tags: [
      'nacionalidad española',
      'menor nacido en España',
      'residencia legal',
      'Registro Civil',
      'Ministerio de Justicia',
      'tasa 790-026'
    ],
    updatedAt: '13 may 2026',
    readTime: '14 min',
    relatedServiceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Nacionalidad española para menor nacido en España | Guía completa',
    seoDescription:
      'Requisitos, documentación, plazo de 1 año de residencia legal, tasa 790-026 y proceso para solicitar la nacionalidad española de un menor nacido en España.',
    body: `
## Resumen del trámite

Si tu hijo o hija ha nacido en España y ya cuenta con residencia legal, puede tener derecho a solicitar la nacionalidad española por residencia con un plazo reducido de **1 año de residencia legal, continuada e inmediatamente anterior a la solicitud**.

Este supuesto no significa que la nacionalidad se obtenga de forma automática por haber nacido en España. El nacimiento en territorio español ayuda a reducir el plazo exigido, pero la solicitud debe prepararse y presentarse correctamente ante el Ministerio de Justicia.

## Para quién es esta guía

Esta guía está pensada para familias extranjeras residentes en España cuyo hijo o hija:

- Ha nacido en España.
- Está inscrito en el Registro Civil español.
- Tiene NIE/TIE o autorización de residencia legal en España.
- Ha cumplido, o está próximo a cumplir, 1 año de residencia legal.
- Es menor de edad.
- Cuenta con progenitores o representantes legales dispuestos a firmar la solicitud.

## Requisito clave: 1 año de residencia legal

El punto más importante es comprobar desde cuándo el menor tiene residencia legal propia. No basta con que los progenitores tengan residencia legal. Hay que acreditar que el menor ha tenido residencia legal, continuada e inmediatamente anterior a la solicitud.

Antes de presentar conviene revisar:

- Fecha de concesión de la autorización inicial.
- Fecha de emisión de la TIE.
- Posible existencia de una tarjeta anterior.
- Resolución administrativa de residencia o protección temporal.
- Continuidad de la residencia.

Presentar antes de cumplir el plazo puede provocar requerimientos, retrasos o incluso una denegación.

## Firma de los progenitores

Si ambos progenitores ejercen la patria potestad, lo recomendable es que firmen ambos como representantes legales del menor.

En menores de 14 años, cuando ambos representantes legales están de acuerdo y firman la solicitud, no debería exigirse la autorización previa del Encargado del Registro Civil en los supuestos ordinarios posteriores a la Ley 8/2021.

Si solo uno de los progenitores puede firmar, hay desacuerdo, o existe una situación familiar especial, el caso debe estudiarse antes de presentar.

## Documentación del menor

Normalmente se revisa y prepara:

- Certificación literal de nacimiento española expedida por el Registro Civil.
- Pasaporte completo y en vigor, con copia de todas las páginas.
- NIE/TIE o documento acreditativo de residencia legal en España.
- Tarjeta de residencia anterior, si existe.
- Resolución inicial de concesión de residencia o protección temporal, si existe.
- Certificado de empadronamiento familiar o colectivo actualizado.
- Certificado de guardería o centro infantil, solo si el menor asiste a un centro.

## Documentación de los progenitores

También se revisa:

- Pasaporte completo y en vigor de ambos progenitores.
- NIE/TIE de ambos progenitores por ambas caras.
- Certificado de empadronamiento familiar, si no se aporta por separado.
- Datos de contacto: teléfono, correo electrónico y domicilio actual.
- Firma de ambos progenitores como representantes legales del menor.

Si solo uno de los progenitores puede firmar, puede ser necesario aportar documentación adicional que justifique representación suficiente.

## Tasa administrativa

La solicitud de nacionalidad española por residencia exige el pago de la tasa administrativa mediante el modelo **790 código 026**.

La tasa administrativa actual indicada para este trámite es de **104,05 €**. Esta tasa se abona aparte de los honorarios profesionales de preparación y presentación del expediente.

El justificante debe cumplimentarse correctamente a nombre del menor solicitante.

## Cómo funciona el proceso

1. Revisión inicial de viabilidad.
2. Comprobación del plazo de 1 año de residencia legal.
3. Revisión de documentación del menor y progenitores.
4. Preparación del expediente.
5. Pago de la tasa administrativa.
6. Presentación telemática ante el Ministerio de Justicia, cuando proceda.
7. Entrega del justificante y número de expediente.
8. Seguimiento básico inicial.

## Plazos de resolución

El procedimiento de nacionalidad por residencia tiene un plazo legal máximo de resolución de 1 año desde la entrada de la solicitud en el órgano competente. Si transcurre ese plazo sin resolución expresa, la solicitud se entiende desestimada por silencio administrativo, sin perjuicio de las vías de recurso que puedan corresponder.

En la práctica, los tiempos pueden variar según la carga administrativa, la calidad del expediente y la existencia o no de requerimientos.

## Casos en los que conviene revisar antes de contratar

Conviene estudiar el caso antes de presentar si:

- No está claro desde cuándo el menor tiene residencia legal.
- Solo uno de los progenitores puede firmar.
- Hay diferencias de nombres o apellidos entre documentos.
- El pasaporte está caducado.
- No hay certificado literal de nacimiento español.
- La residencia se ha concedido recientemente.
- Hay cambios de domicilio no reflejados en el empadronamiento.
- Hay documentación extranjera sin traducir o sin legalizar.

## Preguntas frecuentes

### ¿Mi hijo obtiene la nacionalidad automáticamente por haber nacido en España?

No. Nacer en España puede reducir el plazo exigido para solicitar la nacionalidad por residencia a 1 año, pero no concede automáticamente la nacionalidad española en todos los casos.

### ¿Sirve la residencia de los padres?

No basta con la residencia legal de los padres. Hay que verificar la residencia legal del menor.

### ¿Hace falta autorización previa del Registro Civil?

Si ambos progenitores están de acuerdo y firman la solicitud, en los supuestos ordinarios no debería exigirse autorización previa del Encargado del Registro Civil. Si hay discrepancia o firma solo un progenitor sin justificación suficiente, hay que estudiar el caso.

### ¿El menor tiene que hacer examen CCSE o DELE?

No. En menores de edad no se exigen las pruebas de adultos en los términos ordinarios. La integración se valora conforme a la edad y circunstancias del menor.
    `
  },
  {
    slug: 'residencia-legal-menor-nacido-espana-nacionalidad',
    category: 'extranjeria-nacionalidad',
    title: 'Residencia legal del menor nacido en España',
    excerpt:
      'Cómo comprobar la fecha de inicio de residencia legal del menor antes de presentar la nacionalidad española por residencia.',
    tags: ['residencia legal', 'menor nacido en España', 'TIE', 'NIE', 'nacionalidad por residencia'],
    updatedAt: '13 may 2026',
    readTime: '7 min',
    relatedServiceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Residencia legal del menor nacido en España para nacionalidad',
    seoDescription:
      'Qué fechas revisar para acreditar el año de residencia legal del menor nacido en España antes de solicitar la nacionalidad española.',
    body: `
## El nacimiento no sustituye a la residencia

En expedientes de nacionalidad para menores nacidos en España, uno de los errores más habituales es pensar que el nacimiento en territorio español basta para presentar.

Para la nacionalidad por residencia debe acreditarse un periodo de residencia legal. El plazo puede ser reducido, pero ese plazo cuenta desde la residencia legal del menor.

## Qué fechas hay que revisar

Antes de presentar conviene comprobar:

- Fecha de concesión de la autorización inicial.
- Fecha de efectos de la resolución, si consta.
- Fecha de expedición de la TIE.
- Existencia de una tarjeta anterior.
- Renovaciones o cambios de autorización.
- Periodos sin cobertura documental.

La fecha de la tarjeta no siempre es la fecha jurídicamente más útil. En muchos casos hay que revisar la resolución administrativa para entender desde cuándo existe autorización.

## Protección temporal y autorizaciones especiales

Si el menor tiene documentación vinculada a protección temporal u otra autorización especial, el expediente debe analizarse caso por caso.

Lo importante es acreditar que existe residencia legal suficiente y que no hay interrupciones relevantes antes de presentar.

## Qué pasa si se presenta demasiado pronto

Una presentación prematura puede generar:

- Requerimiento de documentación adicional.
- Paralización del expediente.
- Necesidad de aportar resoluciones no previstas.
- Mayor riesgo de denegación por falta de plazo.

Cuando hay dudas, es preferible revisar antes que presentar a ciegas.

## Recomendación práctica

Guarda siempre copia de:

1. Resolución inicial de concesión.
2. TIE actual y anteriores.
3. Pasaporte completo.
4. Empadronamiento actualizado.
5. Comunicaciones de Extranjería, si las hay.

Con esa documentación se puede reconstruir la línea temporal del menor y decidir el momento correcto para presentar la solicitud.
    `
  },
  {
    slug: 'documentos-nacionalidad-menor-nacido-espana',
    category: 'extranjeria-nacionalidad',
    title: 'Documentos para nacionalidad de menor nacido en España',
    excerpt:
      'Lista ordenada de documentos del menor y de sus progenitores para preparar el expediente de nacionalidad española por residencia.',
    tags: ['documentación', 'nacionalidad española', 'pasaporte', 'empadronamiento', 'Registro Civil'],
    updatedAt: '13 may 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Documentos para nacionalidad de menor nacido en España',
    seoDescription:
      'Documentación del menor y de los progenitores para preparar la solicitud de nacionalidad española por residencia.',
    body: `
## Documentos del menor

Para preparar el expediente de nacionalidad española por residencia de un menor nacido en España, normalmente se revisa:

- Certificación literal de nacimiento española expedida por el Registro Civil.
- Pasaporte completo y en vigor, con copia de todas las páginas.
- NIE/TIE o documento acreditativo de residencia legal.
- Tarjeta de residencia anterior, si existe.
- Resolución inicial de concesión de residencia, si se conserva.
- Certificado de empadronamiento familiar o colectivo actualizado.
- Certificado de centro escolar o guardería, si procede.

## Documentos de los progenitores

También se necesita revisar:

- Pasaporte completo y en vigor de ambos progenitores.
- NIE/TIE de ambos progenitores por ambas caras.
- Datos de contacto actualizados.
- Domicilio actual.
- Firma de ambos progenitores, salvo que exista causa justificada para otra forma de representación.

Si hay separación, desacuerdo, patria potestad limitada o imposibilidad de firma, el caso debe estudiarse antes de presentar.

## Errores documentales frecuentes

Los problemas más habituales son:

- Pasaporte caducado o incompleto.
- Certificado literal de nacimiento antiguo o ilegible.
- Nombres escritos de forma distinta entre documentos.
- Falta de resolución de residencia.
- Empadronamiento no actualizado.
- Firma de un solo progenitor sin explicación suficiente.

Estos errores no siempre impiden presentar, pero aumentan el riesgo de requerimientos.

## Tasa administrativa

La solicitud exige el pago de la tasa del Ministerio de Justicia mediante el modelo 790 código 026. El justificante debe estar correctamente vinculado al menor solicitante.

Antes de pagar la tasa, conviene tener el expediente revisado para evitar pagar cuando todavía falta un requisito esencial.

## Cómo organizar la documentación

Una forma práctica de preparar el envío es separar los archivos en tres bloques:

1. Documentos del menor.
2. Documentos de los progenitores.
3. Documentos de residencia y empadronamiento.

Los archivos deben verse completos, sin cortes, sombras ni páginas omitidas. Un expediente ordenado no garantiza una resolución rápida, pero reduce el riesgo de requerimientos evitables.
    `
  }
];

export const legacyDocRedirects: Record<string, string> = {
  'nacionalidad-menor-nacido-espana-requisitos': 'nacionalidad-espanola-menor-nacido-en-espana'
};

export function getDoc(slug: string): KnowledgeDoc | undefined {
  return docs.find((doc) => doc.slug === slug);
}

export function getDocRedirectTarget(slug: string): KnowledgeDoc | undefined {
  return docs.find((doc) => doc.slug === (legacyDocRedirects[slug] ?? slug));
}

export function getDocCategory(slug: DocCategorySlug) {
  return docCategories.find((category) => category.slug === slug);
}

export function getAllDocTags(): string[] {
  return Array.from(new Set(docs.flatMap((doc) => doc.tags))).sort((a, b) => a.localeCompare(b, 'es'));
}

export function getDocsForService(serviceSlug: string): KnowledgeDoc[] {
  return docs.filter((doc) => doc.relatedServiceSlugs?.includes(serviceSlug));
}
