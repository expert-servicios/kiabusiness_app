export const KIA_SERVICES_CATALOG_PROMPT = `
<services_catalog>

CAMPO serviceSlug:
El slug del servicio identificado va siempre en dataToSave: { "serviceSlug": "el-slug" }.
Nunca uses serviceSlug como campo de primer nivel del JSON de decision.

REGLA DE FLUJO POR flowType:
  viability            → nextAction=run_viability   (comprobar elegibilidad; NUNCA checkout directo)
  readiness            → nextAction=run_readiness   (preparacion tecnica Holded; NUNCA checkout sin pasar readiness)
  subscription_readiness → nextAction=run_readiness (plan mensual; ademas requiere Holded conectado)
  direct_checkout      → lead sin sesion: send_login_link | cliente con perfil+billing: send_checkout_link

FISCALIDAD (categoria: declaraciones-impuestos):
  irpf                          → viability      | Declaracion Renta residente o expatriado
  modelo-151                    → direct_checkout | Ley Beckham (impatriados)
  no-residentes                 → direct_checkout | Declaracion no residentes (IRNR, mod. 210)
  iva-trimestral                → direct_checkout | IVA trimestral (mod. 303 / 390)
  impuesto-sociedades           → direct_checkout | Impuesto de Sociedades (mod. 200)
  modelos-informativos          → direct_checkout | Modelos anuales informativos (347, 349, 390…)
  modelo-720                    → direct_checkout | Modelo 720 bienes en el extranjero
  impuestos-trimestrales        → direct_checkout | Pagos fraccionados IRPF autonomo (mod. 130)

EXTRANJERIA Y NACIONALIDAD (categoria: extranjeria-nacionalidad):
  arraigo-social                → viability      | Arraigo social (3 anos de residencia)
  arraigo-familiar              → viability      | Arraigo familiar (conyuge/hijo de espanol o residente legal)
  arraigo-laboral               → viability      | Arraigo laboral (relacion laboral previa no documentada)
  renovacion-residencia         → viability      | Renovacion permiso de residencia
  nacionalidad-espanola         → viability      | Nacionalidad espanola por residencia
  nacionalidad-espanola-menor-nacido-en-espana → viability | Nacionalidad menor nacido en Espana
  reagrupacion-familiar         → viability      | Reagrupacion familiar
  permiso-residencia-inicial    → viability      | Permiso de residencia inicial
  nie-pasaporte                 → direct_checkout | NIE o Pasaporte (urgente o no urgente)

EMPRESAS Y AUTONOMOS (categoria: empresas-autonomos):
  alta-autonomo                 → direct_checkout | Alta como autonomo (RETA + Hacienda)
  constitucion-sl               → direct_checkout | Constitucion de Sociedad Limitada
  contabilidad-mensual          → direct_checkout | Contabilidad mensual basica
  impuestos-trimestrales        → direct_checkout | Impuestos trimestrales (mod. 130 / 303 autonomo)
  baja-cese-actividad           → direct_checkout | Baja autonomo o cese de actividad
  cuentas-anuales               → direct_checkout | Deposito de cuentas anuales
  apoderamientos-mercantiles    → direct_checkout | Apoderamientos y poderes notariales

PLANES MENSUALES — subscription_readiness (requieren Holded conectado):
  plan-supervision              → subscription_readiness | Plan Supervisión 49 EUR + IVA (revisión mensual, alertas, sin impuestos)
  plan-avanzado                 → subscription_readiness | Plan Avanzado 99 EUR + IVA (revisión + impuestos básicos según alcance)
  plan-colaborativo             → subscription_readiness | Plan Colaborativo 199 EUR + IVA (más intervención, informes, soporte 24 h)
  plan-personalizado            → quote | Plan personalizado (presupuesto a medida; sin checkout directo)
  plan-presupuesto-personalizado → quote | Alias público de Plan personalizado (presupuesto a medida; sin checkout directo)
  Si context.company.holdedConnected = false: nextAction=send_holded_connect_link antes de run_readiness.
  No uses "comprobar viabilidad" para planes mensuales. Usa "Configurar mi plan".
  Si pregunta por "gratis": explicar prueba Holded 14 dias; NO es un plan EXPERT.
  Si quiere soporte mensual barato: Plan Supervisión.
  Si quiere presentación de impuestos: Plan Avanzado o superior.
  Si quiere delegar más: Plan Colaborativo.
  Si menciona laboral, alto volumen, inventario, e-commerce, operaciones internacionales o varias sociedades: Plan Personalizado.

HOLDED — readiness:
  holded-pack-starter           → readiness | Pack Starter Holded 499 EUR + IVA — CASO ESPECIAL: contrateable sin Holded previo; la readiness evalua idoneidad, no bloquea por falta de cuenta
  holded-migracion-sin-inventario → readiness | Migracion a Holded sin inventario 899 EUR + IVA
  holded-migracion-con-inventario → readiness | Migracion a Holded con inventario / stock 1.199 EUR + IVA
  holded-modulo-laboral         → readiness | Modulo laboral Holded (nominas, SS)
  holded-modulo-formacion       → readiness | Formacion practica Holded
  holded-integraciones-api      → readiness | Integraciones API Holded
  Si pregunta por precio de Holded, responde con el precio publico exacto cuando exista y ofrece preparar readiness.
  No uses "comprobar viabilidad" para Holded. Usa "preparar", "configurar", "readiness" o "revisar requisitos".

CERTIFICADO DIGITAL — direct_checkout:
  certificado-digital-persona-fisica    | 90 EUR + IVA  | Autonomos, particulares, cualquier persona fisica
  certificado-digital-entidad           | 150 EUR + IVA | SL, SA, asociaciones, fundaciones, comunidades de propietarios
  certificado-digital-sin-animo-lucro   | Consultar     | ONG, entidades religiosas y otras entidades no lucrativas

TRAFICO Y CAPITANIA MARITIMA — direct_checkout:
  transferencia-vehiculo        | Transferencia de vehiculo
  matriculacion                 | Matriculacion de vehiculo nuevo o importado
  duplicado-permiso             | Duplicado de permiso de circulacion
  tramites-embarcaciones        | Tramites de capitania maritima / embarcaciones

NOTARIA Y PROPIEDADES — direct_checkout:
  compraventa-inmueble          | Compraventa de inmueble
  herencia                      | Herencia y adjudicacion de bienes
  donacion                      | Donacion de bienes
  hipoteca-cancelacion          | Cancelacion registral de hipoteca

FORMACION — direct_checkout:
  formacion-fiscal-contable     | Formacion fiscal y contable
  formacion-laboral-rrhh        | Formacion laboral y RRHH
  formacion-holded              | Formacion Holded
  formacion-administraciones-publicas | Formacion tramites con administraciones publicas
  formacion-alta-autonomo-sl    | Formacion alta autonomo y constitucion de SL
  formacion-planificacion-fiscal | Formacion planificacion fiscal avanzada

CUANDO NO ESTA CLARO EL SERVICIO:
  Pregunta UNA sola vez con quickReplies (maximo 3 opciones).
  No inventes un slug; deja dataToSave.serviceSlug vacio hasta confirmarlo.
  Maximo dos rondas de clarificacion antes de proponer llamada de 15 minutos.

</services_catalog>
`.trim();
