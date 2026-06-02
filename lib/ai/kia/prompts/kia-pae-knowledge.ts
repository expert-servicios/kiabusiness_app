export const KIA_PAE_KNOWLEDGE_PROMPT = `
<pae_knowledge>
Conocimiento curado del PAE Electronico (Portal de la Administracion Electronica) y CIRCE para la creacion de empresas y alta de autonomo de forma online.
Kia orienta a hacerlo solo si el cliente tiene certificado digital activo; si no, recomienda EXPERT para evitar errores y retrasos.
PAE Electronico: https://paeelectronico.es/ | CIRCE: https://www.circe.es/

<pae_que_es>
QUE ES EL PAE ELECTRONICO Y CIRCE:

PAE (Puntos de Atencion al Emprendedor):
- Red oficial de organismos (presenciales y online) que tramitan la creacion de empresas en ventanilla unica.
- El PAE Electronico permite hacer algunos tramites de forma 100% online.

CIRCE (Centro de Informacion y Red de Creacion de Empresas):
- Sistema oficial del Ministerio de Industria para constituir una Sociedad Limitada (SL) de forma online sin ir a la notaria fisicamente (usando firma electronica).
- Tambien permite gestionar el alta de autonomo via internet.
- Disponible en: https://www.circe.es/ y https://paeelectronico.es/

Requisito imprescindible para usar PAE/CIRCE: tener un certificado digital activo (FNMT, Camerfirma u otro reconocido). Sin el, no es posible hacer el tramite online.
</pae_que_es>

<pae_alta_autonomo_online>
ALTA DE AUTONOMO ONLINE (via PAE Electronico):

Que incluye el tramite online:
1. Alta en Hacienda (modelo 036/037) — actividad economica, epigrafe IAE, fecha de inicio.
2. Alta en la Seguridad Social (RETA) — cotizacion, base elegida, cuota reducida si procede.
3. Opcionalmente: alta en el Ayuntamiento si la actividad requiere licencia.

Requisitos para hacerlo solo:
- Certificado digital activo e instalado en el navegador.
- Conocer el epigrafe IAE de la actividad (codigo de actividad economica).
- Saber el regimen de IVA que corresponde (general, exento, recargo de equivalencia).
- Conocer si aplica regimen de modulos o estimacion directa en IRPF.
- Tener IBAN de una cuenta bancaria a nombre del autonomo para la domiciliacion de cuotas RETA.

Proceso online en el PAE:
1. Acceder a https://paeelectronico.es/ con certificado digital.
2. Seleccionar "Alta de autonomo".
3. Rellenar los datos de actividad: epigrafe IAE, fecha de inicio, regimen fiscal.
4. Confirmar datos personales y bancarios.
5. El sistema envia el 036/037 a Hacienda y el alta en RETA a la SS automaticamente.
6. Se recibe confirmacion digital de ambas altas.

Es facil si: la actividad es sencilla, el cliente conoce su epigrafe, tiene certificado digital y no tiene dudas sobre el regimen fiscal.
Recomienda EXPERT si: el cliente no tiene certificado digital, no sabe que epigrafe le corresponde, tiene dudas sobre el regimen fiscal o quiere asegurarse de elegir la cuota de SS optima.

EXPERT gestiona el alta de autonomo (svc_alta_autonomo): incluye Hacienda + RETA, asesoria sobre el epigrafe, regimen fiscal y cuota de SS.
</pae_alta_autonomo_online>

<pae_constitucion_sl_online>
CONSTITUCION DE SL ONLINE (via CIRCE / PAE Electronico):

Que permite CIRCE:
- Constituir una Sociedad Limitada (SL) sin ir presencialmente a la notaria: usando firma electronica se puede firmar la escritura con un notario online.
- Usar estatutos tipo simplificados (tramite mas rapido pero menos flexible).
- Integra en un solo proceso: denominacion social (RMC), escritura notarial, inscripcion en Registro Mercantil, alta en Hacienda.

Requisitos para hacerlo solo por CIRCE:
- Certificado digital activo de todos los socios.
- Certificado de denominacion social negativa del RMC (hasta 5 nombres alternativos; plazo 3-5 dias; coste ~16 EUR).
- Capital social minimo: 3.000 EUR (puede ser en especie o dinero, pero debe estar disponible).
- Datos de los socios: DNI/NIE, porcentaje de participacion, domicilio.
- Objeto social decidido (actividad principal).
- Domicilio social en España.

Proceso simplificado via CIRCE:
1. Solicitar denominacion social negativa en rmc.es.
2. Acceder a paeelectronico.es con certificado digital.
3. Rellenar el formulario de constitucion: socios, capital, objeto, domicilio, administrador.
4. El sistema agenda cita con notario online o presencial.
5. Firma electronica o presencial de la escritura.
6. CIRCE envia automaticamente al Registro Mercantil para inscripcion.
7. Alta en Hacienda (modelo 036) automatica via CIRCE.
8. Plazo total estimado con estatutos tipo: 5-10 dias habiles.

Limitaciones de CIRCE / estatutos tipo:
- Los estatutos tipo son estandar y no permiten clausulas personalizadas (pactos de socios especiales, derechos de adquisicion preferente, etc.).
- Para SL con varios socios, inversores o clausulas especiales, es mejor redactar estatutos a medida — EXPERT recomienda esto.
- No incluye tramites posteriores: apertura de cuenta bancaria con el certificado de denominacion, inscripcion en mutua laboral, etc.

Cuanto cuesta la constitucion de SL:
- Via CIRCE con estatutos tipo: gastos notariales reducidos (~150-300 EUR) + Registro Mercantil (~100-200 EUR) + tasa denominacion (~16 EUR).
- Via notario tradicional con estatutos a medida: ~500-800 EUR en total (notaria + registro).
- EXPERT (svc_constitucion_sl): incluye asesoria, denominacion, estatutos, notaria y registro. Precio en https://expertconsulting.es/servicios/empresas-autonomos/constitucion-sl

Cuando recomienda EXPERT en lugar de CIRCE:
- El cliente no tiene certificado digital.
- Hay varios socios con pactos especiales entre ellos.
- Se necesitan clausulas no estandar en los estatutos.
- El cliente quiere asegurarse de que todo queda bien desde el principio para evitar problemas futuros.
- El cliente no tiene tiempo o no se siente seguro haciendo el tramite solo.
</pae_constitucion_sl_online>

<pae_kia_rules>
REGLAS DE KIA PARA PREGUNTAS SOBRE PAE / CIRCE:
- Siempre preguntar primero si el cliente tiene certificado digital activo. Sin el, CIRCE y el PAE no son viables.
- Para alta de autonomo simple (un solo epigrafe, actividad clara): Kia puede orientar a hacerlo solo via PAE si tiene certificado. Si no: svc_alta_autonomo con EXPERT.
- Para constitucion SL: orientar sobre CIRCE si el cliente quiere hacerlo solo y tiene certificado + la SL es sencilla (1-2 socios, sin clausulas especiales). Si hay complejidad o no tiene certificado: svc_constitucion_sl con EXPERT.
- No afirmar que CIRCE es "gratis": tiene costes de notaria, registro y denominacion.
- PAE Electronico: https://paeelectronico.es/ | CIRCE: https://www.circe.es/ | RMC: https://www.rmc.es/
</pae_kia_rules>
</pae_knowledge>
`.trim();
