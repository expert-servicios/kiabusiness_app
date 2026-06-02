export const KIA_CCAA_KNOWLEDGE_PROMPT = `
<ccaa_knowledge>
Conocimiento curado de tributos gestionados por las Comunidades Autonomas y organismos locales.
Los tipos y bonificaciones se actualizan periodicamente. Verificar en la sede de la CCAA correspondiente para el ejercicio actual.
EXPERT gestiona estos impuestos en los servicios de compraventa, herencia y transmisiones (svc_notaria_compraventa, svc_notaria_herencia).

<ccaa_itp>
ITP — IMPUESTO DE TRANSMISIONES PATRIMONIALES ONEROSAS:

Que es: impuesto que paga el COMPRADOR en la compraventa de bienes de segunda mano (inmuebles, vehiculos, etc.) entre particulares o cuando el vendedor no aplica IVA.
Quien lo gestiona: la CCAA del comprador (para inmuebles: la CCAA donde esta el inmueble).
Plazo de pago: 30 dias habiles desde la firma de la escritura o contrato.

Tipos generales por CCAA (inmuebles — orientativos, verificar para el ejercicio actual):
- Madrid: 6% (uno de los mas bajos de España).
- Andalucia: 7% (reducido) hasta ciertos valores; 8-10% en tramos superiores.
- Comunitat Valenciana: 10% general.
- Cataluna: 10% general; puede llegar al 11% para inmuebles de mayor valor.
- Pais Vasco: 4% (regimen foral propio, tipo reducido historicamente).
- Aragon, Castilla y Leon, Extremadura: en torno al 8%.
- Islas Baleares, Canarias: tipos propios (Canarias aplica IGIC en lugar de IVA, con diferencias en ITP).

Para vehiculos de segunda mano: el ITP se calcula sobre el valor venal (tabla oficial de la AEAT/CCAA), no sobre el precio de compraventa acordado. Tipo general: 4-8% segun CCAA.
Modelo de autoliquidacion: generalmente el modelo 600 de la CCAA (o 620 para vehiculos en algunas CCAA).
</ccaa_itp>

<ccaa_isd>
ISD — IMPUESTO DE SUCESIONES Y DONACIONES:

Que es: impuesto sobre las herencias recibidas (sucesiones) y sobre los bienes recibidos como donacion.
Quien lo gestiona: la CCAA de residencia del fallecido (sucesiones) o del donatario (donaciones).
Es uno de los impuestos con MAS diferencias entre CCAA — puede ir de casi 0 EUR a cantidades muy significativas.

Diferencias clave por CCAA (herencias entre familiares directos — orientativo):
- Madrid: bonificacion del 99% en cuota para herencias entre conyuges, hijos y padres → tributacion casi nula para familiares directos.
- Andalucia: desde 2021, bonificacion del 99% para grupo I y II (descendientes, ascendientes, conyuges) → casi sin tributacion.
- Cataluna: tipos progresivos; bonificacion del 99% para conyuges; para hijos, reduccion de 100.000 EUR pero tipo efectivo puede ser significativo para patrimonios altos.
- Comunitat Valenciana: bonificacion del 75% para grupo I y II.
- Pais Vasco: regimen foral. Para familiares directos, exenciones amplias; tipo residual bajo.
- Resto de CCAA: grandes diferencias; algunas con bonificaciones del 99%, otras con tipos efectivos relevantes.

Donaciones:
- Tambien gestionadas por las CCAA con tipos y reducciones propios.
- En general, las donaciones en vida tributan mas que las herencias en muchas CCAA.
- Algunas CCAA tienen bonificaciones para donaciones de vivienda habitual a hijos.

Plazo de autoliquidacion:
- Sucesiones: 6 meses desde el fallecimiento (prorrogable otros 6 meses si se solicita en los primeros 5).
- Donaciones: 30 dias habiles desde la firma notarial.

EXPERT gestiona el ISD en los servicios de herencia (svc_notaria_herencia).
</ccaa_isd>

<ccaa_ajd>
AJD — ACTOS JURIDICOS DOCUMENTADOS:

Que es: impuesto que grava los documentos notariales, mercantiles y administrativos que tienen contenido economico.
En la practica, lo paga el comprador en escrituras de compraventa de inmuebles NUEVOS (sujetas a IVA) y en constitucion/ampliacion de hipotecas.
Quien lo gestiona: la CCAA donde se otorga el documento notarial.

Tipos orientativos por CCAA:
- Madrid: 0,75%.
- Andalucia: 1,2% (reducido a 0,1% para primera vivienda habitual protegida).
- Comunitat Valenciana: 1,5%.
- Cataluna: 1,5%.
- Pais Vasco: 0,5% (regimen foral).
- Media nacional: entre 0,5% y 1,5%.

Nota importante: desde 2018 (Real Decreto-ley 17/2018), en las hipotecas el AJD lo paga el BANCO, no el cliente.

EXPERT gestiona el AJD en compraventas de obra nueva y tramites notariales.
</ccaa_ajd>

<ccaa_patrimonio>
IMPUESTO DE PATRIMONIO:

Que es: impuesto anual sobre el patrimonio neto de las personas fisicas (bienes y derechos menos deudas).
Gestionado por las CCAA, que pueden bonificarlo total o parcialmente.

Estado actual por CCAA (orientativo — sujeto a cambios legislativos frecuentes):
- Madrid: bonificacion del 100% → tributacion cero.
- Andalucia: bonificacion del 100% desde 2023 → tributacion cero.
- Cataluna: se aplica con tipos del 0,21% al 2,75% sobre el patrimonio neto que supere el minimo exento.
- Comunitat Valenciana: se aplica; minimo exento general de 500.000 EUR.
- Pais Vasco: regimen foral propio, con tipos y minimos exentos diferentes.
- Resto de CCAA: gran variabilidad; algunas bonifican al 100%, otras no.

Minimo exento estatal: 700.000 EUR de patrimonio neto + 300.000 EUR adicionales por vivienda habitual.
Quien debe presentarlo: quienes superen el minimo exento o cuya cuota sea positiva (incluso con bonificaciones en algunas CCAA).
Plazo: coincide con la campana del IRPF (abril-junio).

EXPERT asesora sobre si el cliente debe o no presentar el impuesto de patrimonio y lo gestiona si procede.
</ccaa_patrimonio>

<ccaa_tributos_locales>
TRIBUTOS LOCALES (AYUNTAMIENTOS):

IBI — Impuesto sobre Bienes Inmuebles:
- Lo gestiona el Ayuntamiento del municipio donde esta el inmueble.
- Se paga anualmente; el recibo llega normalmente en otoño.
- En muchas provincias lo recauda un organismo autonomo provincial:
  * Alicante: SUMA (https://www.suma.es/)
  * Valencia: Diputacion Provincial / SUMMA
  * Madrid: Agencia Tributaria de Madrid (ATM)
  * Barcelona: Organisme de Gestio Tributaria (ORGT)
  * Malaga: CIMALSA / Suma Gestiona
- Si el cliente tiene inmuebles en Alicante: remitir a SUMA (https://www.suma.es/).
- Para otras provincias: buscar en la web del Ayuntamiento o Diputacion correspondiente.

IVTM — Impuesto sobre Vehiculos de Traccion Mecanica (impuesto de circulacion):
- Lo gestiona el Ayuntamiento de empadronamiento del titular del vehiculo.
- Se paga anualmente; normalmente por domiciliacion o en periodo voluntario (primavera-verano).
- En caso de baja temporal del vehiculo en DGT, se puede solicitar exencion.

IAE — Impuesto sobre Actividades Economicas:
- Obligatorio solo para empresas y autonomos con cifra de negocios superior a 1.000.000 EUR/año.
- Los autonomos con facturacion inferior estan exentos de cuota (pero deben estar dados de alta en el censo del IAE si realizan la actividad).

IIVTNU — Plusvalia Municipal (Impuesto sobre el Incremento de Valor de los Terrenos de Naturaleza Urbana):
- Lo paga el VENDEDOR en la compraventa de inmuebles urbanos (o el heredero en las herencias).
- Se calcula sobre el incremento del valor catastral del terreno desde la adquisicion.
- Gestionado por el Ayuntamiento del municipio donde esta el inmueble.
- EXPERT lo gestiona como parte del servicio de compraventa o herencia.
</ccaa_tributos_locales>

<ccaa_sedes_principales>
SEDES TRIBUTARIAS AUTONOMICAS PRINCIPALES:
- Comunitat Valenciana (ATV): https://atv.gva.es/
- Cataluna (ATC): https://atc.gencat.cat/
- Andalucia (AEAT Andalucia / Junta): https://www.juntadeandalucia.es/haciendayadministracionpublica/
- Madrid (ATM): https://www.madrid.org/wap/es/desarrolla/atencion-tributaria.html
- Pais Vasco — Bizkaia: https://www.bizkaia.eus/ogasuna | Gipuzkoa: https://www.gipuzkoa.eus | Alava: https://www.araba.eus
- Aragon: https://www.aragon.es/departamentos/departamento-de-hacienda
- SUMA Alicante (IBI, IVTM, IAE): https://www.suma.es/
</ccaa_sedes_principales>

<ccaa_kia_rules>
REGLAS DE KIA PARA PREGUNTAS SOBRE TRIBUTOS AUTONOMICOS Y LOCALES:
- Para ISD (herencias): siempre preguntar en que CCAA residia el fallecido, ya que las diferencias son enormes (Madrid casi 0, Cataluna puede ser significativo). Recomendar consulta con EXPERT antes de actuar.
- Para ITP (compraventa): siempre preguntar si el inmueble es de primera o segunda mano (primera mano paga IVA + AJD; segunda mano paga ITP).
- Para IBI/IVTM: orientar al cliente a la sede del Ayuntamiento o Diputacion correspondiente. Si es Alicante: SUMA.
- No dar tipos exactos como definitivos sin indicar que deben verificarse para el ejercicio actual.
- EXPERT gestiona: compraventas (ITP/AJD/plusvalia), herencias (ISD), patrimonio. Servicios: svc_notaria_compraventa, svc_notaria_herencia.
</ccaa_kia_rules>
</ccaa_knowledge>
`.trim();
