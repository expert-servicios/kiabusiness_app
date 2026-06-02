export const KIA_SS_KNOWLEDGE_PROMPT = `
<ss_knowledge>
Conocimiento curado de la Seguridad Social (TGSS / INSS) para orientar a clientes.
EXPERT gestiona altas, bajas y tramites con la SS. Kia orienta; los tramites oficiales se realizan en Importass o sede de Inclusion.
Nota general: cuotas y bases de cotizacion se actualizan cada ano. Verificar siempre en https://importass.seg-social.es/ o https://www.seg-social.es/ para el ano en curso.

<ss_reta>
REGIMEN ESPECIAL DE TRABAJADORES AUTONOMOS (RETA):

Quien debe darse de alta:
- Toda persona que realiza una actividad economica de forma habitual, personal y directa, por cuenta propia.
- Incluye: autonomos clasicos, socios administradores con mas del 25% del capital, socios trabajadores de SL, profesionales liberales colegiados (en algunos casos tienen su propia mutua).
- En general, si facturas por actividades economicas de forma regular, debes estar de alta en RETA.

Alta en RETA — proceso:
1. Primero: alta en Hacienda con modelo 036/037 (indicar fecha de inicio).
2. Despues (o simultaneamente): alta en RETA a traves de Importass (https://importass.seg-social.es/) o con certificado digital / Cl@ve.
3. Plazo: antes del inicio de la actividad o en los primeros dias. El alta en SS puede hacerse con hasta 60 dias de antelacion.
4. Si no tienes certificado digital, EXPERT puede gestionar el alta en tu nombre.

Baja en RETA:
- Tambien a traves de Importass. La baja surte efecto desde el dia en que se comunica (si se hace dentro del mes) o desde el dia 1 del mes siguiente.
- Simultaneamente se debe presentar baja en Hacienda (modelo 036/037).
</ss_reta>

<ss_cuotas>
CUOTAS DE AUTONOMOS — SISTEMA POR TRAMOS DE RENDIMIENTO NETO (vigente desde 2023):

Desde 2023 las cuotas de autonomos se calculan en funcion de los rendimientos netos anuales previstos, en lugar de la base de cotizacion elegida libremente.
Existen 15 tramos. En 2025 los tramos y cuotas han vuelto a actualizarse.

Referencia orientativa (verificar cuotas exactas para el ano en curso en Importass):
- Rendimientos muy bajos (menos de 670 EUR/mes netos): cuota minima reducida.
- Rendimientos medios: cuota intermedia segun tramo.
- Rendimientos altos (mas de 6.000 EUR/mes netos): cuota maxima.

Cuota reducida para nuevos autonomos (sustituye a la antigua "tarifa plana"):
- Los primeros 12 meses: cuota fija reducida (en 2024 era 80 EUR/mes; verificar importe actualizado).
- Los 12 meses siguientes: cuota reducida si los rendimientos netos son inferiores al SMI.
- Condicion: no haber estado de alta en RETA en los 2 anos anteriores (3 si se disfrutaron bonificaciones previas).
- Solicitar en Importass al darse de alta.

Cambio de tramo:
- Se puede cambiar de tramo hasta 6 veces al ano si los ingresos varian.
- Al final del ano se regulariza: si has cotizado por menos de lo que corresponderia a tus rendimientos reales, pagas la diferencia; si has cotizado por mas, te devuelven.
- Portal: https://importass.seg-social.es/
</ss_cuotas>

<ss_vida_laboral>
INFORME DE VIDA LABORAL:

Que es: documento oficial que recoge todos los periodos cotizados a la Seguridad Social a lo largo de la vida profesional.

Como obtenerlo:
1. Online con certificado digital o Cl@ve en Importass: https://importass.seg-social.es/ (opcion "Informe de vida laboral").
2. Por SMS: solicitar en https://www.seg-social.es/ y recibirlo en el movil en minutos.
3. Presencialmente en la oficina de la Seguridad Social mas cercana.
4. Por correo postal: solicitar que lo envien al domicilio.

Para que se usa: acreditar años cotizados para pension, justificar situacion laboral en tramites de extranjeria, solicitar prestaciones, etc.
</ss_vida_laboral>

<ss_prestaciones>
PRESTACIONES Y COBERTURAS PARA AUTONOMOS:

Incapacidad temporal (baja laboral):
- Los autonomos tienen derecho a prestacion por IT desde el 4o dia de baja (los 3 primeros dias van por cuenta del autonomo).
- Importe: 60% de la base reguladora del 4o al 20o dia; 75% a partir del 21o.
- Tramite: el medico de cabecera expide el parte de baja; se comunica a la mutua o al INSS.
- Se puede seguir dado de alta en RETA durante la baja (la cuota puede quedar exonerada si se contrata a un sustituto; consultar condiciones actuales).

Cese de actividad (prestacion equivalente al paro para autonomos):
- Requisito principal: haber cotizado por cese de actividad al menos 12 meses continuos y acreditar causas economicas, tecnicas u organizativas (perdidas, deudas, fuerza mayor, etc.).
- Duracion: entre 2 y 24 meses segun el tiempo cotizado.
- Tramite: solicitar en la mutua colaboradora o en el SEPE si la mutua no cubre cese.
- Importante: la solicitud debe hacerse dentro del mes siguiente al cese.
- Mas info: https://www.sepe.es/HomeSepe/autonomos/prestacion-cese-actividad.html

Maternidad/Paternidad:
- Mismas condiciones que trabajadores por cuenta ajena: 16 semanas (ampliables) con prestacion del 100% de la base reguladora.
- Tramite a traves de la mutua o INSS.
</ss_prestaciones>

<ss_empleados>
ALTA Y BAJA DE EMPLEADOS EN LA SEGURIDAD SOCIAL:

Alta de trabajador (cuenta ajena):
- Obligatoria antes o en el momento del inicio de la relacion laboral (no el dia siguiente).
- Tramite a traves del Sistema RED o en la Sede Electronica de la SS: https://sede.seg-social.gob.es/
- Requiere numero de afiliacion del trabajador (si no lo tiene, se solicita primero).
- EXPERT gestiona altas/bajas de empleados para clientes con gestion laboral contratada.

Baja de trabajador:
- Comunicar en el plazo de 3 dias naturales desde el cese.
- Incluir la causa (fin de contrato, dimision, despido, etc.).

Partes de alta/baja medica de empleados: el medico los emite; la empresa los comunica a la SS a traves del sistema FIE.
</ss_empleados>

<ss_acceso_digital>
PORTALES OFICIALES DE LA SEGURIDAD SOCIAL:

- Importass (TGSS — Tesoreria General SS): https://importass.seg-social.es/
  * Vida laboral, altas/bajas RETA, cuotas, bases de cotizacion, certificados.
- Sede Electronica SS: https://sede.seg-social.gob.es/
  * Tramites para empresas, trabajadores y ciudadanos.
- INSS (Instituto Nacional SS): https://www.seg-social.es/
  * Pensiones, incapacidad, maternidad, cese de actividad.
- SEPE (paro): https://www.sepe.es/
  * Prestaciones por desempleo, cese de actividad de autonomos.
</ss_acceso_digital>

<ss_kia_rules>
REGLAS DE KIA PARA PREGUNTAS SOBRE SEGURIDAD SOCIAL:
- Para cuotas exactas: orientar sobre el sistema de tramos e indicar que el importe exacto se calcula en Importass segun los rendimientos declarados. No afirmar cuotas exactas sin citar la fuente actual.
- Si preguntan si EXPERT gestiona el alta de autonomo: si, EXPERT gestiona el alta en Hacienda (036/037) y en RETA (Importass) de forma conjunta. Servicio: svc_alta_autonomo.
- Para bajas IT y cese de actividad: orientacion inicial + recomendar llamada con EXPERT si el caso es complejo.
- Para empleados (altas/bajas laborales): EXPERT gestiona esto con la gestion laboral mensual.
- EXPERT gestiona: alta autonomo, alta en RETA, gestion mensual de cuotas, tramites SS para empresas con empleados.
</ss_kia_rules>
</ss_knowledge>
`.trim();
