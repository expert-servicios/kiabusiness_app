export const KIA_AEAT_KNOWLEDGE_PROMPT = `
<aeat_knowledge>
Conocimiento curado de la Agencia Tributaria (AEAT / Hacienda) para orientar a clientes.
EXPERT gestiona estos tramites profesionalmente. Kia orienta; la presentacion oficial la hace EXPERT o el propio cliente desde la sede electronica.
Nota general: plazos y cuantias se actualizan cada ejercicio. Siempre verificar en https://sede.agenciatributaria.gob.es/ para el ano en curso.

<aeat_irpf>
DECLARACION DE LA RENTA (IRPF):

Quien debe presentarla:
- En general, quien haya obtenido rentas del trabajo superiores a 22.000 EUR anuales de un pagador (o 15.000 EUR de dos o mas pagadores si el segundo supera 1.500 EUR).
- Siempre si eres autonomo, tienes rentas de alquiler, ganancias patrimoniales, rendimientos de capital o rentas del extranjero.
- Si has recibido subvenciones o ayudas publicas (ej. ayudas al alquiler, Plan MOVES).
- La obligacion exacta depende de la situacion personal — EXPERT revisa caso a caso.

Campana de la renta (ejercicio anterior):
- Habitualmente se abre a principios de abril y cierra el 30 de junio del ano siguiente al ejercicio.
- La presentacion con resultado a ingresar con domiciliacion bancaria cierra unos dias antes (normalmente el 25 de junio).
- Verificar fechas exactas en: https://sede.agenciatributaria.gob.es/Sede/Renta.html

Como obtener el numero de referencia (para acceder a Renta WEB sin certificado digital):
1. Ve a https://www1.agenciatributaria.gob.es/wlpl/DABJ-REN0/ObtenerReferenciaServlet
2. Opcion A (recomendada): usa Cl@ve Movil — escanea el QR con la app Cl@ve y autentica.
3. Opcion B: introduce DNI/NIE + dato de contraste (IBAN o casilla 505 del ano anterior) y recibe un PIN por SMS.
4. La referencia tiene 6 caracteres y es valida solo para la campana actual. Solo la ultima generada es valida.

Renta WEB: herramienta oficial de la AEAT para hacer y presentar la declaracion online.
Acceso: https://sede.agenciatributaria.gob.es/Sede/Renta.html
</aeat_irpf>

<aeat_iva>
IVA (Impuesto sobre el Valor Anadido):

Quien lo aplica: autonomos y empresas que realizan actividades economicas sujetas a IVA.
Tipos generales: 21% (general), 10% (reducido, ej. hosteleria, transporte), 4% (superreducido, ej. alimentos basicos).
Algunos autonomos en regimen de modulos o en actividades exentas no aplican IVA.

Modelos y plazos (trimestral):
- Modelo 303 — liquidacion trimestral del IVA.
  * 1T: 1-20 abril | 2T: 1-20 julio | 3T: 1-20 octubre | 4T: 1-30 enero del ano siguiente.
- Modelo 390 — resumen anual del IVA. Plazo: 1-30 enero del ano siguiente.
- Modelo 349 — operaciones intracomunitarias (si facturas a empresas de la UE sin IVA).
- Verificar plazos exactos en: https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/iva.html
</aeat_iva>

<aeat_autonomos>
AUTONOMOS EN HACIENDA:

Alta en Hacienda (obligatoria antes o al inicio de la actividad):
- Modelo 036 o 037 (version simplificada) — declaracion censal.
  * Indica la actividad economica (epigrafe IAE), la fecha de inicio, el tipo de IRPF y si eres sujeto pasivo de IVA.
- Si no tienes certificado digital ni Cl@ve PIN, EXPERT puede gestionar el alta.

IRPF trimestral (pagos fraccionados):
- Modelo 130 — estimacion directa normal o simplificada (la mayoria de autonomos).
  * Plazos: mismos que IVA (abril, julio, octubre, enero).
- Modelo 131 — estimacion objetiva (modulos).
- Se ingresa el 20% del rendimiento neto trimestral (menos retenciones soportadas).

Retenciones en facturas:
- Autonomos en estimacion directa deben incluir retencion IRPF en sus facturas si el cliente es empresa o profesional (generalmente 15%, reducida al 7% los primeros anos de actividad).
- La retencion la ingresa el pagador a Hacienda via modelo 111 trimestral.

Baja en Hacienda:
- Tambien con modelo 036/037, indicando la fecha de cese de actividad.
</aeat_autonomos>

<aeat_otros_modelos>
OTROS MODELOS FRECUENTES:

Modelo 720 — bienes y derechos en el extranjero:
- Obligacion informativa (no impositiva) para residentes fiscales con bienes, cuentas o seguros en el extranjero que superen 50.000 EUR por categoria.
- Plazo: 1 enero - 31 marzo del ano siguiente.
- Importante: las sanciones por no presentar fueron muy altas historicamente; revisar la normativa actualizada con EXPERT.
- Mas info: https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI34.shtml

Modelo 151 / Ley Beckham (regimen especial de impatriados):
- Para trabajadores desplazados a Espana que cumplen requisitos: tributar como no residente (tipo fijo 24%) durante maximo 6 anos.
- Solicitud en los 6 meses desde inicio de la actividad en Espana.
- Requiere revision profesional — EXPERT gestiona la solicitud y la declaracion anual.

IRNR / No Residentes (modelo 210):
- Para personas sin residencia fiscal en Espana que obtienen rentas en Espana (alquiler de inmuebles, dividendos, etc.).
- Trimestral si hay renta de alquiler; anual si es imputacion de renta.
- EXPERT gestiona el modelo 210 para no residentes con inmuebles en Espana.

Notificaciones electronicas (DEHu / DEHU):
- La AEAT y otras administraciones envian notificaciones electronicas obligatorias.
- Es imprescindible tener certificado digital o Cl@ve activos para recibirlas.
- Portal: https://dehu.redsara.es/
- Si no se accede en plazo, la notificacion se tiene por recibida igualmente.
</aeat_otros_modelos>

<aeat_acceso_digital>
ACCESO A LA SEDE ELECTRONICA:

Opciones de identificacion:
1. Certificado digital (FNMT-RCM, Camerfirma u otros) — el mas completo y recomendado para profesionales y autonomos.
2. Cl@ve PIN — identificacion con movil, valida para muchos tramites.
3. Cl@ve Permanente — registro unico, sin caducidad, para tramites frecuentes.
4. Numero de referencia (solo para declaracion de la renta).
5. DNI electronico (DNIe) con lector de tarjetas.

Sede electronica AEAT: https://sede.agenciatributaria.gob.es/
Renta WEB: https://sede.agenciatributaria.gob.es/Sede/Renta.html
Cl@ve: https://clave.gob.es/
</aeat_acceso_digital>

<aeat_kia_rules>
REGLAS DE KIA PARA PREGUNTAS SOBRE AEAT/HACIENDA:
- Siempre distinguir entre "orientacion" (Kia puede dar pasos generales) y "presentacion de modelos" (EXPERT lo hace, o el cliente directamente con certificado digital).
- Para requerimientos, sanciones, inspecciones, recursos o embargos de Hacienda: orientacion inicial + recomendar llamada de 15 min con EXPERT de forma urgente.
- No inventar plazos ni cuantias exactas si no aparecen en este contexto; indicar que deben verificarse para el ejercicio actual.
- Verificar siempre si el cliente tiene o necesita certificado digital o Cl@ve — es la puerta de entrada a todos los tramites online.
- EXPERT gestiona: renta, IVA trimestral, autonomos, modelo 720, no residentes, modelo 151, recursos y tramites con Hacienda.
</aeat_kia_rules>
</aeat_knowledge>
`.trim();
