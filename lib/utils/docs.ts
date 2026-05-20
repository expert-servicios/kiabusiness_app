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
  },

  // ── Extranjería ────────────────────────────────────────────────────────────
  {
    slug: 'arraigo-social-requisitos-y-proceso',
    category: 'extranjeria-nacionalidad',
    title: 'Arraigo social: requisitos, documentación y proceso completo',
    excerpt: 'Guía detallada sobre el arraigo social en España: quién puede pedirlo, qué documentos necesita y cómo funciona el proceso paso a paso.',
    tags: ['arraigo social', 'residencia temporal', 'empadronamiento', 'antecedentes penales', 'EX-10'],
    updatedAt: '18 may 2026',
    readTime: '10 min',
    relatedServiceSlugs: ['arraigo-social'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Arraigo social en España: requisitos y documentación | Guía completa',
    seoDescription: 'Requisitos, documentos y proceso para obtener el arraigo social en España. Vía más habitual para regularizar la situación tras 3 años de permanencia.',
    body: `
## ¿Qué es el arraigo social?

El arraigo social es una **autorización de residencia temporal** que permite regularizar la situación en España a personas extracomunitarias que llevan al menos 3 años de permanencia continuada en el país.

Es una de las vías más utilizadas para obtener el primer permiso de residencia legal. Una vez concedida, la autorización tiene una vigencia inicial de **1 año**, renovable.

## Quién puede solicitarlo

Para poder solicitar el arraigo social es necesario cumplir todos los requisitos siguientes:

- **Permanencia continuada de al menos 3 años** en España, aunque sea en situación irregular.
- **Ausencia de antecedentes penales** en España y en el país o países de residencia anteriores durante los últimos 5 años.
- **No estar incurso en causa de prohibición de entrada** en España o en otro país con el que España tenga acuerdo de control.
- Acreditar **vínculos con España** mediante alguna de las vías siguientes:
  - Oferta de trabajo firmada por un empleador.
  - Vínculos familiares con ciudadanos españoles o residentes legales (cónyuge, pareja de hecho, ascendientes, descendientes).
  - Informe de arraigo emitido por el Ayuntamiento o los servicios sociales competentes.

## Documentación necesaria

El expediente básico incluye:

- **Modelo EX-10** cumplimentado y firmado.
- **Pasaporte** en vigor con copia de todas las páginas.
- **Fotografía** reciente en color tamaño carné.
- **Justificante de pago** de la tasa modelo 790 código 052.
- **Certificado de empadronamiento con historial** que acredite los 3 años de permanencia.
- **Certificado de antecedentes penales de España**, obtenido en el Ministerio de Justicia o la Policía Nacional.
- **Certificado de antecedentes penales del país de origen**, apostillado y con traducción jurada al español.
- Según la vía de arraigo elegida: **contrato de trabajo firmado**, **informe de arraigo municipal** o **documentación del vínculo familiar**.

## El empadronamiento: el documento más importante

El certificado de empadronamiento es el núcleo del expediente. Hay que solicitar el **certificado con historial completo**, no solo el volante de residencia actual.

Puntos críticos:

- Un período sin empadronamiento puede interrumpir el cómputo de los 3 años.
- Si hubo cambios de domicilio, cada Ayuntamiento genera su propio histórico; hay que solicitar todos.
- En algunos Ayuntamientos el certificado histórico tarda días o semanas: solicitarlo con antelación.

## Los antecedentes penales del país de origen

Este documento suele generar los mayores retrasos. Hay que tener en cuenta:

- Cada país tiene su propio organismo emisor. Comprueba cuál es el competente en tu caso.
- El documento original debe llevar la **apostilla del Convenio de La Haya** para ser válido en España. Si tu país no forma parte del Convenio, se necesita legalización consular.
- Una vez apostillado, debe ser traducido por un **traductor jurado** reconocido por el Ministerio de Asuntos Exteriores de España.
- Los certificados de antecedentes suelen tener una vigencia de **3 meses**. Solicítalo cuando el resto de la documentación esté lista.

## La vía más habitual: oferta de trabajo

Para el arraigo social mediante oferta de trabajo, el contrato debe:

- Estar firmado por empresa y trabajador.
- Indicar categoría, jornada y salario conforme al convenio colectivo aplicable.
- Tener una duración de al menos 1 año o ser indefinido.
- Cumplir los requisitos mínimos de jornada (generalmente 30 horas semanales o la jornada completa del sector).

La empresa no está obligada a esperar a que se resuelva el expediente para mantener el contrato: lo que se aporta es la oferta de trabajo, no la formalización definitiva.

## Proceso y plazos

El expediente se presenta en la **Oficina de Extranjería** de la provincia donde el solicitante esté empadronado.

| Fase | Plazo aproximado |
|---|---|
| Preparación de documentación | 2–4 semanas |
| Presentación en Extranjería | 1 día |
| Resolución administrativa | 3 meses (plazo legal) |
| Recogida del TIE en comisaría | 30–45 días tras resolución |

Si la Administración no resuelve en 3 meses, opera el silencio administrativo negativo. En la práctica, las oficinas suelen resolver, aunque con variaciones según la provincia.

## Errores más frecuentes

- Empadronamiento con períodos sin cobertura o cambios de domicilio no regularizados.
- Antecedentes del país de origen sin apostillar o con traducción no jurada.
- Contrato de trabajo que no cumple los requisitos mínimos de jornada.
- Presentar la solicitud en la oficina incorrecta (debe ser la de la provincia de empadronamiento).
- Documentos caducados (pasaporte, antecedentes penales) al momento de la presentación.

## ¿Y después del arraigo?

La autorización inicial de arraigo social tiene vigencia de **1 año**. Si se ha mantenido la relación laboral, puede renovarse por períodos de 2 años. Tras 5 años de residencia legal y continuada, se puede acceder a la **residencia de larga duración**.
    `
  },
  {
    slug: 'permiso-residencia-inicial-vias-y-documentos',
    category: 'extranjeria-nacionalidad',
    title: 'Permiso inicial de residencia: vías disponibles y documentación',
    excerpt: 'Análisis de las principales vías para obtener el primer permiso de residencia en España, con los documentos necesarios para cada una y los plazos reales.',
    tags: ['permiso de residencia', 'arraigo', 'reagrupación familiar', 'TIE', 'EX-01', 'extranjería'],
    updatedAt: '18 may 2026',
    readTime: '11 min',
    relatedServiceSlugs: ['permiso-residencia-inicial'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Permiso inicial de residencia en España: vías y documentos',
    seoDescription: 'Guía completa sobre las vías para obtener el primer permiso de residencia en España: arraigo, reagrupación, trabajo y circunstancias excepcionales.',
    body: `
## ¿Qué es el permiso inicial de residencia?

El permiso inicial de residencia —también llamado autorización de residencia temporal— es el primer documento que permite vivir legalmente en España durante un período determinado.

Sin este permiso, la estancia más allá de 90 días (para quienes lo necesiten) es irregular y puede generar sanciones, expulsión y prohibición de entrada.

## Principales vías de acceso

### Arraigo social
La vía más utilizada. Requiere **3 años de permanencia continuada** en España y acreditar vínculos mediante oferta de trabajo, vínculo familiar o informe de arraigo.

### Arraigo laboral
Requiere acreditar **2 años de estancia irregular** y una relación laboral no declarada de al menos 6 meses. El empresario debe regularizar el contrato.

### Arraigo familiar
Para personas con vínculo de primer grado con ciudadanos españoles o con menores españoles. No requiere tiempo mínimo de estancia.

### Reagrupación familiar
Cuando un familiar con residencia legal en España solicita la reunificación.

### Residencia por circunstancias excepcionales
Incluye colaboración con autoridades, protección internacional, trata de seres humanos, violencia de género.

### Visado de larga duración
Tramitado desde el consulado del país de origen: trabajo, estudios, nómada digital, inversión.

## Documentación base para el arraigo social (vía más común)

- Modelo EX-01 cumplimentado.
- Pasaporte en vigor (copia de todas las páginas).
- Fotografía reciente.
- Tasa modelo 790 código 052.
- Certificado de empadronamiento histórico (mínimo 3 años).
- Antecedentes penales de España.
- Antecedentes penales del país de origen (apostillados + traducción jurada).
- Documentación de la vía elegida: contrato de trabajo, informe de arraigo o documentación familiar.

## La tasa administrativa

Para la mayoría de autorizaciones de residencia temporal, la tasa se paga mediante el **modelo 790 código 052**. El importe varía según el tipo de autorización. El justificante debe conservarse y aportarse junto con la solicitud.

## Plazos reales

El plazo legal de resolución es de **3 meses** desde la presentación. En la práctica, los tiempos varían mucho por provincia: algunas oficinas resuelven en 6–8 semanas, otras tardan 4–6 meses por acumulación de expedientes.

Si la Administración no resuelve en 3 meses, opera el **silencio administrativo negativo**. Esto no significa denegación automática: la solicitud sigue en tramitación, pero abre la vía de recurso si fuera necesario.

## El TIE: el paso final

Una vez resuelta favorablemente la solicitud, hay **30 días hábiles** para solicitar la Tarjeta de Identidad de Extranjero (TIE) en la comisaría de Policía.

Para el TIE se necesita:
- Resolución favorable de Extranjería.
- Pasaporte original.
- Fotografía en color.
- Tasa modelo 790 código 012.
- Cita previa.

El TIE se entrega habitualmente en 30–45 días desde la solicitud.

## Errores más frecuentes

1. Pasaporte caducado o próximo a caducar.
2. Antecedentes del país de origen sin apostillar o sin traducción jurada.
3. Empadronamiento que no refleja 3 años continuados.
4. Contrato de trabajo que no cumple las horas mínimas.
5. Solicitar en la oficina de la provincia incorrecta.
    `
  },
  {
    slug: 'renovacion-residencia-temporal-y-larga-duracion',
    category: 'extranjeria-nacionalidad',
    title: 'Renovación de residencia: plazos, documentos y paso a larga duración',
    excerpt: 'Cuándo y cómo renovar el permiso de residencia temporal, qué documentos necesitas y cómo acceder a la residencia de larga duración tras 5 años.',
    tags: ['renovación residencia', 'larga duración', 'TIE', 'extranjería', 'vida laboral'],
    updatedAt: '18 may 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['renovacion-residencia'],
    relatedServiceCategories: ['extranjeria-nacionalidad'],
    seoTitle: 'Renovación de residencia en España: plazos y documentación',
    seoDescription: 'Guía sobre cómo renovar el permiso de residencia en España, cuándo hacerlo, qué documentos necesitas y cómo pasar a la residencia de larga duración.',
    body: `
## Cuándo presentar la renovación

La renovación puede presentarse dentro de los **60 días previos** a la caducidad del permiso actual. También se acepta hasta **90 días después** de la caducidad, aunque esto puede conllevar sanción leve.

Lo recomendable es iniciar la reunión de documentación **3–4 meses antes** de la fecha de caducidad para evitar imprevistos.

## ¿Qué pasa si caduca mientras espero resolución?

Si presentaste la solicitud en plazo y la Administración no ha resuelto cuando caduca tu permiso actual, tu situación sigue siendo **regular**: el resguardo de presentación de la solicitud lo acredita. Esta prórroga es automática y no requiere trámite adicional.

## Documentación habitual para la renovación

Los documentos más frecuentemente solicitados son:

- **Pasaporte en vigor** con copia de todas las páginas.
- **Certificado de empadronamiento** actualizado.
- **Informe de vida laboral** (TGSS).
- **Nóminas de los últimos 3–6 meses** o documentación de medios económicos.
- **Contrato de trabajo en vigor** o alta como autónomo.
- **Tasa modelo 790 código 052**.
- En algunos casos, certificado de antecedentes penales (si ha transcurrido mucho tiempo desde el anterior).

## De la residencia temporal a la larga duración

Tras **5 años de residencia legal y continuada** en España se puede solicitar la **autorización de residencia de larga duración**. Esta autorización:

- Se concede por tiempo indefinido.
- Permite trabajar por cuenta propia o ajena sin autorización laboral específica.
- Es renovable cada 5 años sin riesgo de denegación si se mantienen los requisitos.

### Requisitos para la larga duración

1. 5 años de residencia legal y continuada en España.
2. Ausencia de antecedentes penales.
3. Medios económicos suficientes: al menos el 150 % del IPREM mensual para el titular (aprox. 900 €/mes en 2025), más el 50 % por familiar a cargo.
4. Seguro médico si no se cotiza a la Seguridad Social.

## Períodos de desempleo y la renovación

Haber estado en situación de desempleo y haber percibido prestación **no impide renovar**. La prestación por desempleo se considera una situación cotizada. Lo importante es demostrar actividad económica legal durante el período de vigencia del permiso anterior.

## Qué pasa si no se renueva a tiempo

- **Multa** por estancia irregular.
- Posible expediente sancionador.
- Pérdida de continuidad del cómputo de años de residencia, lo que puede retrasar la larga duración o la nacionalidad.

## Consejo práctico

Lleva un control activo de las fechas de caducidad. Una renovación presentada con antelación y bien documentada se resuelve sin sobresaltos. Una renovación urgente o tardía genera estrés, posibles sanciones y, en el peor caso, irregularidad sobrevenida.
    `
  },

  // ── Fiscalidad ─────────────────────────────────────────────────────────────
  {
    slug: 'declaracion-renta-irpf-guia',
    category: 'fiscalidad',
    title: 'Declaración de la Renta (IRPF): guía práctica para residentes en España',
    excerpt: 'Todo lo que necesitas saber sobre la campaña de renta: quién está obligado, qué documentos aportar, deducciones habituales y plazos.',
    tags: ['IRPF', 'declaración de la renta', 'deducciones', 'AEAT', 'campaña de renta'],
    updatedAt: '18 may 2026',
    readTime: '9 min',
    relatedServiceSlugs: ['irpf'],
    relatedServiceCategories: ['declaraciones-impuestos'],
    seoTitle: 'Declaración de la Renta IRPF: guía completa | EXPERT Asesoría',
    seoDescription: 'Guía práctica sobre la declaración de la renta en España: quién declara, deducciones, plazos y qué documentos necesitas reunir.',
    body: `
## ¿Quién está obligado a declarar?

Están obligados a presentar el IRPF los contribuyentes que superen los umbrales establecidos por la normativa. Con carácter general, deben declarar quienes:

- Obtienen **rendimientos del trabajo superiores a 22.000 € anuales** de un único pagador (o 15.000 € si hay varios pagadores y el segundo supera 1.500 €).
- Tienen **rendimientos de capital inmobiliario, ganancias patrimoniales o imputaciones** que superen ciertos límites.
- Son **autónomos** con actividad económica, independientemente del importe.
- Quieren recuperar **retenciones** o aplicar deducciones que generen resultado a devolver.

Aunque no estés obligado, en muchos casos interesa declarar para obtener la devolución de retenciones.

## Campaña de renta: plazos habituales

| Modalidad | Plazo habitual |
|---|---|
| Presentación online (con resultado a ingresar con domiciliación) | Hasta finales de junio |
| Presentación online (a devolver o sin ingreso) | Desde abril hasta finales de junio |
| Con resultado a ingresar fraccionado | Primera parte hasta finales de junio |

La campaña de IRPF arranca habitualmente en **abril** y cierra a finales de **junio**. No esperes al último momento: el volumen de solicitudes en las últimas semanas puede retrasar las gestiones.

## Documentos que necesitas reunir

Antes de empezar conviene tener:

- **DNI o NIE** en vigor.
- **Número de referencia AEAT** (o Cl@ve) para acceder al borrador.
- **Certificados de retenciones** de todos los pagadores (empresa, pensión, SEPE...).
- **Datos de inmuebles** en propiedad o alquiler: referencia catastral, valor catastral, porcentaje de titularidad, días de alquiler.
- **Préstamos hipotecarios**: certificado de intereses pagados (si deducible por antigüedad del préstamo).
- **Datos de inversiones**: fondos, acciones, depósitos — ganancias y pérdidas patrimoniales.
- **Aportaciones a planes de pensiones**.
- **Donaciones** a ONG o partidos (si aplicas deducción).
- **Certificado de rendimientos del extranjero** si has trabajado fuera de España.

## Deducciones más habituales

Las deducciones reducen la cuota a pagar o aumentan la devolución:

- **Deducción por vivienda habitual**: solo para hipotecas anteriores a 2013.
- **Deducción por planes de pensiones**: reducen la base imponible hasta ciertos límites.
- **Deducción por maternidad**: para madres trabajadoras con hijos menores de 3 años.
- **Deducción por familia numerosa o personas con discapacidad**.
- **Deducciones autonómicas**: cada comunidad tiene las suyas (alquiler, nacimiento de hijo, compra de libros de texto...).
- **Deducción por donativos**: 80 % de los primeros 250 € y 35 % o 40 % del resto.

## El borrador de Hacienda: ¿siempre es correcto?

El borrador que prepara la AEAT parte de los datos que ya tiene. Puede no incluir:

- Inmuebles en alquiler.
- Actividades económicas.
- Ganancias y pérdidas de inversiones.
- Rendimientos en el extranjero.
- Deducciones a las que tienes derecho pero Hacienda no conoce.

Confirmar el borrador sin revisarlo puede suponer pagar más de lo que corresponde o no obtener la devolución que te pertenece.

## Resultado de la declaración

La declaración puede salir:

- **A devolver**: Hacienda te ingresa el importe en tu cuenta.
- **A ingresar**: debes pagar. Puedes domiciliar el pago hasta finales de junio o fraccionarlo en dos pagos.
- **Sin resultado**: declaración informativa sin ingreso ni devolución.

## Declaración conjunta o individual

Si estás casado, puedes optar por declaración individual o conjunta. La conjunta aplica una reducción de 3.400 € en la base imponible, pero suma todos los ingresos. Conviene calcular ambas opciones antes de elegir.
    `
  },
  {
    slug: 'regimen-beckham-modelo-151-guia',
    category: 'fiscalidad',
    title: 'Régimen Beckham (Modelo 151): quién puede acogerse y cómo funciona',
    excerpt: 'Guía técnica sobre el régimen especial de impatriados: requisitos de acceso, tipo fijo del 24%, cómo solicitar el Modelo 149 y diferencias con el IRPF ordinario.',
    tags: ['Modelo 151', 'Régimen Beckham', 'impatriados', 'expatriados', 'Modelo 149'],
    updatedAt: '18 may 2026',
    readTime: '10 min',
    relatedServiceSlugs: ['modelo-151'],
    relatedServiceCategories: ['declaraciones-impuestos'],
    seoTitle: 'Régimen Beckham y Modelo 151: guía completa | EXPERT Asesoría',
    seoDescription: 'Todo sobre el régimen especial de impatriados: quién puede acogerse, tipo fijo del 24%, cómo solicitar la opción y cuándo conviene frente al IRPF ordinario.',
    body: `
## ¿Qué es el régimen especial de impatriados?

El régimen especial de impatriados (popularmente llamado **Ley Beckham**) permite a personas que se desplazan a España por motivos laborales tributar al **tipo fijo del 24 %** sobre sus rentas obtenidas en España (hasta 600.000 €), en lugar del tipo progresivo general del IRPF (que puede llegar al 47 %).

La declaración anual se presenta mediante el **Modelo 151**, distinto del Modelo 100 que usan los residentes ordinarios.

## Requisitos para acogerse

Para aplicar el régimen en 2025 es necesario cumplir **todos** los requisitos siguientes:

- **No haber sido residente fiscal en España** durante los 5 años anteriores al desplazamiento.
- Desplazarse a España por:
  - Un **contrato de trabajo** con empresa española.
  - Para **ejercer funciones de administrador** de una sociedad española (no vinculada o con vinculación permitida).
  - Como **nómada digital**: trabajador remoto con visado de nómada digital.
- El trabajo o la administración deben realizarse **efectivamente en España**.

## Cómo solicitar la opción al régimen

La solicitud se presenta mediante el **Modelo 149** ante la AEAT, dentro del plazo de **6 meses** desde la fecha de inicio de la actividad en España (alta en Seguridad Social o inicio del contrato).

Este es un plazo crítico: si se presenta fuera de plazo, el régimen no puede aplicarse.

## Tipo impositivo y bases

| Base imponible | Tipo aplicable |
|---|---|
| Hasta 600.000 € | 24 % |
| Exceso sobre 600.000 € | 47 % |

Las **rentas obtenidas fuera de España** (salvo rendimientos del trabajo) quedan **exentas** de tributación en España, lo que puede suponer una ventaja significativa para quienes mantengan patrimonio o rentas en el extranjero.

## Duración del régimen

El régimen se aplica durante el **año del desplazamiento y los 5 siguientes** (6 años en total). No es prorrogable si se cumplen los requisitos ordinarios.

## ¿Cuándo conviene acogerse?

No siempre resulta más ventajoso que el IRPF ordinario. El tipo fijo del 24 % es más favorable cuando:

- Los rendimientos del trabajo son elevados (superan los tramos altos del IRPF).
- Se tienen rentas o patrimonio en el extranjero que quedarían exentas.
- No se aplican deducciones personales significativas (hipoteca, hijos, etc.).

Si los ingresos son moderados o hay muchas deducciones personales, el IRPF ordinario puede resultar más beneficioso. **Es imprescindible calcular ambas opciones antes de decidir**.

## Diferencias clave con el IRPF ordinario

| Aspecto | Régimen Beckham | IRPF ordinario |
|---|---|---|
| Tipo impositivo | 24 % (fijo hasta 600.000 €) | 19 %–47 % (progresivo) |
| Rentas extranjeras | En general exentas | Tributación mundial |
| Modelo de declaración | Modelo 151 | Modelo 100 |
| Duración | Hasta 6 años | Indefinido |
| Reducción por trabajo | No aplica | Sí aplica |

## Obligaciones durante el régimen

Mientras se esté bajo el régimen Beckham:

- Se presenta el **Modelo 151** anualmente en lugar del Modelo 100.
- Las retenciones a cuenta son del 24 % (no el tipo marginal).
- Si se obtienen rentas en el extranjero que no tributan en España, en muchos casos no hay obligación de incluirlas en la declaración española.
- El **Modelo 720** (bienes en el extranjero) puede no ser aplicable durante el régimen.

## Causas de exclusión del régimen

Se pierde el derecho al régimen si:

- Se deja de cumplir alguno de los requisitos de acceso.
- Se renuncia expresamente al régimen.
- Se obtiene la residencia habitual en otro país.
    `
  },
  {
    slug: 'irnr-no-residentes-guia',
    category: 'fiscalidad',
    title: 'IRNR (No Residentes): obligaciones fiscales en España',
    excerpt: 'Guía sobre el Impuesto sobre la Renta de No Residentes: quién debe declarar, qué modelos se usan, plazos y cómo evitar la doble imposición.',
    tags: ['IRNR', 'no residentes', 'Modelo 210', 'bienes en España', 'doble imposición'],
    updatedAt: '18 may 2026',
    readTime: '9 min',
    relatedServiceSlugs: ['no-residentes'],
    relatedServiceCategories: ['declaraciones-impuestos'],
    seoTitle: 'IRNR — No Residentes en España: modelos, plazos y obligaciones',
    seoDescription: 'Guía del Impuesto sobre la Renta de No Residentes (IRNR): quién declara, Modelos 210, 211 y 213, plazos y convenios de doble imposición.',
    body: `
## ¿Quién es no residente fiscal en España?

Eres no residente fiscal en España si **no cumples ninguno** de los criterios de residencia fiscal española:

- No permaneces más de 183 días en España durante el año natural.
- Tu centro de intereses económicos no está en España.
- Tu cónyuge e hijos menores no residen habitualmente en España.

Si eres no residente pero tienes bienes, rentas o inversiones en España, tributan en España mediante el **Impuesto sobre la Renta de No Residentes (IRNR)**.

## ¿Qué rentas deben declararse?

Las rentas que deben declararse en España como no residente incluyen:

- **Alquileres de inmuebles** situados en España.
- **Imputación de rentas** por inmuebles en España que no se alquilan (entre el 1,1 % y el 2 % del valor catastral).
- **Dividendos y rendimientos de capital** de fuente española.
- **Ganancias patrimoniales** por venta de inmuebles u otros bienes en España.
- **Rendimientos del trabajo** obtenidos en España.

## Modelos y plazos

### Modelo 210 — El más habitual
Se usa para la mayoría de rentas obtenidas por no residentes:

- **Alquileres**: presentación trimestral (meses de abril, julio, octubre y enero).
- **Imputación de rentas**: presentación anual entre el 1 de enero y el 31 de diciembre del año siguiente.
- **Ganancias patrimoniales por venta de inmueble**: dentro de los 3 meses siguientes a la transmisión.

### Modelo 211 — Retención por compraventa de inmueble
Cuando un residente compra un inmueble a un no residente, el comprador está obligado a retener el **3 %** del precio de venta e ingresarlo en Hacienda mediante el Modelo 211. El vendedor no residente puede recuperar el exceso mediante el Modelo 210.

### Modelo 213 — Gravamen especial sobre inmuebles de entidades no residentes
Se aplica a entidades (no personas físicas) no residentes que poseen inmuebles en España.

## Tipo impositivo

| Tipo de renta | Residentes UE/EEE | Resto del mundo |
|---|---|---|
| Rentas generales | 19 % | 24 % |
| Dividendos y similares | 19 % | 19 % |
| Ganancias patrimoniales | 19 % | 19 % |

## Convenios de doble imposición

España tiene convenios con más de 90 países para evitar que las mismas rentas tributen dos veces. El convenio puede reducir o eliminar la tributación en España dependiendo del tipo de renta.

Para aplicar un convenio es necesario aportar un **certificado de residencia fiscal** expedido por las autoridades del otro país.

## Representante fiscal

Si eres no residente **fuera de la UE/EEE** y tienes propiedades o rentas en España, la normativa española puede obligarte a designar un **representante fiscal** en España ante la AEAT.

## Obligación de declarar aunque no haya ingreso

Un error frecuente es pensar que si no se cobra alquiler no hay que declarar. Sin embargo, los **inmuebles en España que no se alquilan** generan igualmente una imputación de rentas que debe declararse anualmente mediante el Modelo 210.
    `
  },

  // ── Trámites especializados ────────────────────────────────────────────────
  {
    slug: 'certificado-digital-camerfirma-guia',
    category: 'tramites',
    title: 'Certificado digital Camerfirma: tipos, usos y cómo obtenerlo',
    excerpt: 'Guía sobre los certificados digitales Camerfirma: diferencias entre persona física y entidad, para qué sirven, cómo se obtienen y qué necesitas para solicitarlo.',
    tags: ['certificado digital', 'Camerfirma', 'firma electrónica', 'AEAT', 'Seguridad Social'],
    updatedAt: '18 may 2026',
    readTime: '8 min',
    relatedServiceSlugs: ['certificado-digital-persona-fisica', 'certificado-digital-entidad'],
    relatedServiceCategories: ['certificado-digital'],
    seoTitle: 'Certificado digital Camerfirma: guía completa | EXPERT Asesoría',
    seoDescription: 'Cómo obtener el certificado digital Camerfirma para persona física o entidad. Diferencias, usos, proceso y documentación necesaria.',
    body: `
## ¿Para qué sirve el certificado digital?

El certificado digital es un fichero electrónico que identifica de forma segura a una persona física o jurídica en el entorno digital. Es **imprescindible** para:

- Presentar declaraciones y recursos ante la **AEAT** (Hacienda).
- Acceder al **Sistema RED** de la Seguridad Social.
- Realizar trámites en la **sede electrónica** de cualquier Administración Pública.
- Firmar documentos y contratos con **plena validez legal**.
- Acceder al sistema **Cl@ve** y otros servicios digitales del Estado.
- Realizar trámites notariales y registrales de forma electrónica.

## ¿Qué es Camerfirma?

Camerfirma es una **Autoridad de Certificación española acreditada**, perteneciente a las Cámaras de Comercio de España. Sus certificados son reconocidos por todas las Administraciones Públicas españolas y por organismos europeos.

En EXPERT somos **Punto de Registro Autorizado de Camerfirma**, lo que nos permite emitir certificados directamente en nuestras instalaciones o por videoconferencia.

## Tipos de certificado

### Persona física
Identifica a un individuo en sus relaciones personales y profesionales. Válido para cualquier persona física, incluyendo autónomos que actúan en nombre propio.

**Precio: 90 €** | **Tiempo de emisión: inmediato** (presencial o videoconferencia)

### Entidad (persona jurídica)
Identifica a la organización (empresa, asociación, fundación, comunidad de propietarios...) y permite actuar y firmar en nombre de ella.

**Precio: 150 €** | **Tiempo de emisión: 24–48 horas** desde la verificación del representante

## Diferencias clave

| Aspecto | Persona física | Entidad |
|---|---|---|
| Identifica a | El individuo | La organización |
| Firma en nombre de | Sí mismo | La entidad |
| Documentación | DNI/NIE | CIF + escrituras + DNI del representante |
| Tiempo de emisión | Inmediato | 24–48 h |
| Precio | 90 € | 150 € |

## Documentación necesaria

**Para persona física:**
- DNI o NIE original en vigor.
- Email activo al que tengas acceso durante la sesión.

**Para entidad:**
- CIF de la entidad.
- Escrituras de constitución o estatutos vigentes.
- Poderes de representación (si el solicitante no es administrador único).
- DNI o NIE del representante legal.
- Email corporativo activo.

## Proceso de obtención

1. **Solicitud**: tramitamos la solicitud en el sistema de Camerfirma.
2. **Verificación de identidad**: presencial en nuestras instalaciones o por videoconferencia (eIDAS).
3. **Emisión**: el certificado se genera en el momento (persona física) o en 24–48 horas (entidad).
4. **Instalación**: te ayudamos a instalarlo y configurarlo en tu equipo.
5. **Prueba**: verificamos que funciona correctamente antes de terminar.

## Validez y renovación

Los certificados Camerfirma tienen una validez de **2 a 3 años** según el tipo. Cuando se aproxima la caducidad, te avisamos para renovarlo antes de que expire.

Si el certificado caduca sin renovar, es necesario obtener uno nuevo con el mismo proceso de verificación de identidad.

## ¿Debo ir presencialmente?

**Para persona física**: no es necesario desplazarte. La verificación se puede hacer por videoconferencia. Solo necesitas conexión a internet y tu DNI/NIE.

**Para entidad**: el representante legal debe verificar su identidad (también se puede hacer por videoconferencia). Sí es necesario enviar previamente la documentación de la empresa por email para la verificación documental.
    `
  },

  // ── Empresas ───────────────────────────────────────────────────────────────
  {
    slug: 'alta-autonomo-guia-completa',
    category: 'empresas',
    title: 'Alta de autónomo en España: todo lo que debes tramitar',
    excerpt: 'Guía completa sobre el alta de autónomo: pasos en Hacienda y la Seguridad Social, epígrafes del IAE, cuota y obligaciones fiscales desde el primer día.',
    tags: ['alta autónomo', 'RETA', 'Hacienda', 'IAE', 'tarifa plana', 'Modelo 036'],
    updatedAt: '18 may 2026',
    readTime: '9 min',
    relatedServiceSlugs: ['alta-autonomo'],
    relatedServiceCategories: ['empresas-autonomos'],
    seoTitle: 'Alta de autónomo en España: guía completa de trámites',
    seoDescription: 'Cómo darse de alta como autónomo en España: Modelo 036, RETA, elección de epígrafe, cuota 2025 y obligaciones fiscales del primer año.',
    body: `
## ¿Cuándo hay que darse de alta?

En España, debes darte de alta como autónomo **antes de comenzar a ejercer cualquier actividad económica habitual**. Emitir una factura sin estar dado de alta puede generar sanciones de la AEAT y de la Seguridad Social.

## Paso 1: Alta en Hacienda (Modelo 036 o 037)

El primer trámite es comunicar a la AEAT el inicio de actividad mediante el **Modelo 036** (completo) o el **Modelo 037** (simplificado, apto para la mayoría de autónomos).

En este modelo indicarás:

- **Epígrafe del IAE** (Impuesto sobre Actividades Económicas): clasifica la actividad que vas a realizar. Determina el tipo de IVA aplicable y algunas obligaciones específicas.
- **Régimen de IVA**: general, simplificado, recargo de equivalencia o exento según la actividad.
- **Fecha de inicio de la actividad**.
- **Domicilio fiscal**.

### ¿Qué epígrafe elegir?

El epígrafe debe reflejar lo más exactamente posible la actividad que realizarás. Elegir un epígrafe incorrecto puede afectar al tipo de IVA aplicable o a deducciones específicas. En caso de duda, consultar antes de presentar el modelo.

## Paso 2: Alta en la Seguridad Social (RETA)

El **Régimen Especial de Trabajadores Autónomos (RETA)** debe tramitarse en la Seguridad Social, antes de iniciar la actividad o, como máximo, el primer día del mes en que comienzas.

En este trámite elegirás tu **base de cotización**, que determina:

- La **cuota mensual** a pagar.
- Las **prestaciones** a las que tendrás derecho (enfermedad, accidente, jubilación).

## Cuota de autónomos en 2025

Desde 2023 rige el sistema de cotización por **ingresos reales**:

| Rendimientos netos mensuales | Cuota aprox. |
|---|---|
| Menos de 670 € | ~200 €/mes |
| 670 €–1.166 € | ~260–290 €/mes |
| 1.166 €–1.700 € | ~294–350 €/mes |
| 1.700 €–3.000 € | ~370–420 €/mes |
| Más de 6.000 € | ~590 €/mes |

**Tarifa plana**: los nuevos autónomos pagan **80 €/mes durante los primeros 12 meses**, prorrogable si los ingresos no superan el SMI. Algunas comunidades autónomas tienen bonificaciones adicionales.

## Obligaciones fiscales desde el primer día

Como autónomo en régimen general, tus obligaciones trimestrales son:

- **Modelo 303** (IVA trimestral): diferencia entre IVA repercutido y soportado.
- **Modelo 130** (IRPF trimestral): pago fraccionado a cuenta del IRPF.
- Si tienes empleados: **Modelo 111** (retenciones IRPF empleados) y **Modelo 115** (retenciones alquileres).

Anualmente:

- **Modelo 390**: resumen anual de IVA (enero).
- **Modelo 190**: resumen anual de retenciones de trabajo (enero).
- **Modelo 100**: declaración de la renta (mayo–junio).

## Errores frecuentes en el alta

1. **Epígrafe del IAE incorrecto**: afecta al tipo de IVA y a deducciones.
2. **Alta en el RETA fuera de plazo**: puede generar recargos.
3. **Base de cotización mal calculada**: conviene revisar los rendimientos reales esperados.
4. **No solicitar la tarifa plana**: es opcional, hay que pedirla expresamente.
5. **No informar al banco**: conviene actualizar datos para domiciliar la cuota.

## ¿Qué documentos se generan?

Tras el alta recibirás:

- **Resolución de alta en el RETA** con tu número de afiliación.
- **Confirmación del alta censal** de Hacienda.
- **CCC (Código de Cuenta de Cotización)** si vas a tener empleados.
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
