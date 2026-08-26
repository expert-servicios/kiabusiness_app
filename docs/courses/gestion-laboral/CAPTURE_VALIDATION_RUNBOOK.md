# Protocolo de capturas y validación funcional

Fecha de control: **2026-08-26**  
Alcance: manuales `01` a `08` de Gestión Laboral Integral.

## Resultado que debe alcanzarse

La colección exige **58 ubicaciones de imagen** y **57 archivos WebP únicos**. La diferencia se debe a que `holded-convenio-04-pagas-extra-2026-08.webp` se utiliza en los manuales 01 y 02.

Un manual solo puede pasar de `review` a `validated` cuando:

1. se ha recorrido de principio a fin en un entorno autorizado;
2. todos sus controles de aceptación se han superado;
3. el resultado final y las evidencias coinciden con el procedimiento descrito;
4. todas sus capturas están incorporadas, son legibles y no contienen datos reales;
5. no quedan observaciones jurídicas o técnicas críticas abiertas;
6. una segunda persona ha revisado el procedimiento y las imágenes.

## Entornos permitidos

| Plataforma | Entorno recomendado | Qué puede probarse | Prohibición |
|---|---|---|---|
| Holded | Empresa demo o cliente piloto autorizado | En demo: pruebas completas. En cliente: solo operaciones reales necesarias y previamente autorizadas | No experimentar ni crear movimientos ficticios en una empresa real |
| DelegaRed / NetContrata | Cuenta demo facilitada por Creative Quality o expediente real autorizado | Preparación del trámite y navegación; admisión solo en demo oficial o expediente real | No transmitir altas, bajas, variaciones o contratos ficticios a producción |
| Sistema RED / TGSS | Trámite real legítimo con autorización o entorno oficial de prácticas, si está disponible para el acto | Respuesta admitida, IDC y justificantes | No crear movimientos ficticios en una autorización RED real |
| SILTRA | Validación local con datos de formación; envío solo de liquidación real autorizada o prueba oficial | Validación, envío, respuestas, DCL, RNT y RLC | No enviar bases ficticias a TGSS |
| Certific@2 / Contrat@ | Demo del proveedor o comunicación real legítima | Huella y aceptación | No comunicar contratos o certificados ficticios al SEPE |

## Preparación de datos

### Empresa de formación

- Denominación visible: `EMPRESA DEMO FORMACIÓN, S.L.`
- Centro: `Centro Alicante - DEMO`
- CCC, CIF, autorización RED e IBAN: valores de prueba aceptados por el entorno; nunca inventarlos en producción.
- Convenio: uno real y vigente, identificado como ejercicio formativo.

### Personas ficticias

Usar nombres inequívocamente ficticios, por ejemplo `ANA DEMO UNO` y `MARIO DEMO DOS`. DNI/NIE, NAF, domicilio, correo, teléfono e IBAN solo pueden ser valores de prueba dentro de una cuenta demo. No deben coincidir con identificadores reales.

Crear al menos dos perfiles:

- jornada completa, salario según convenio y pagas prorrateadas;
- jornada parcial, variable mensual y pagas no prorrateadas.

## Configuración de captura

- Escritorio: 1440 × 900 o superior.
- Zoom del navegador: 100 %.
- Capturar solo la zona necesaria para entender el paso.
- Guardar el original en PNG fuera del repositorio.
- Publicar exclusivamente WebP, con texto legible y sin metadatos innecesarios.
- Mantener el nombre exacto definido en los manuales.
- No añadir imágenes originales con información real a Git, Drive compartido o mensajería.

## Anonimización irreversible

1. Trabajar sobre una copia del PNG original.
2. Recortar cabeceras, menús o paneles que no aporten información.
3. Cubrir con rectángulo opaco al 100 %, no con desenfoque, cualquier nombre, NIF, NAF, CCC, NSS, IBAN, domicilio, correo, teléfono, número de autorización, certificado, huella o identificador de expediente.
4. Revisar también pestañas, migas de navegación, nombre de usuario, descargas y notificaciones.
5. Exportar una imagen aplanada en WebP.
6. Abrir el WebP exportado y hacer una segunda revisión al 200 %.
7. Eliminar del archivo publicado los metadatos EXIF/XMP si existen.

Cuando sea posible, es preferible producir la pantalla con datos ficticios desde el origen y evitar la redacción posterior.

## Ejecución por lotes

### Lote 1 — Holded: configuración y convenio

- Manuales: 01 y 02.
- Volumen: 20 ubicaciones; 19 archivos únicos.
- Resultado mínimo: centro, convenio versionado, categoría, conceptos, empleado, IRPF, ajuste a bruto y nómina de comprobación coherentes.

### Lote 2 — Alta y contratación

- Manual: 03.
- Volumen: 7 capturas.
- Resultado mínimo: alta admitida e IDC en un expediente legítimo o demo oficial; huella de Contrat@; contrato coherente en Holded.

### Lote 3 — Nómina mensual

- Manual: 04.
- Volumen: 6 capturas.
- Resultado mínimo: incidencias, borrador, aprobación, PDF, asiento y remesa coherentes.

### Lote 4 — Cotización Holded–SILTRA

- Manual: 05.
- Volumen: 7 capturas.
- Resultado mínimo: fichero validado, justificante, respuesta, resolución de discrepancias, DCL, RNT y RLC.

### Lote 5 — Variaciones

- Manual: 06.
- Volumen: 6 capturas.
- Resultado mínimo: fecha y dato modificado coinciden en TGSS, SEPE cuando proceda y Holded; histórico conservado.

### Lote 6 — Baja, finiquito y Certific@2

- Manual: 07.
- Volumen: 7 capturas.
- Resultado mínimo: baja admitida, IDC, vacaciones, liquidación y aceptación de Certific@2 coherentes.

### Lote 7 — Cierre

- Manual: 08.
- Volumen: 5 capturas.
- Resultado mínimo: nóminas, asiento, banco, RNT/RLC, modelo 111 y modelo 190 conciliados.

## Registro de cada prueba

Completar `CAPTURE_VALIDATION_TRACKER.csv` con:

- entorno y versión;
- fecha de ejecución;
- persona que ejecuta y persona que revisa;
- resultado funcional;
- control de datos personales;
- ruta del WebP;
- evidencia final;
- incidencia o desviación detectada.

## Control de versión normativa

El plazo general de bajas y variaciones de datos es, desde el **1 de agosto de 2026**, de **seis días naturales**. La redacción vigente del artículo 32.3.2.º del Real Decreto 84/1996 fue modificada por el Real Decreto 643/2026. Una observación anterior que exigía tres días ha quedado desactualizada y no debe aplicarse a la versión actual de los manuales.

## Secuencia de publicación

1. Incorporar los WebP anonimizados en `public/images/docs/laboral/<plataforma>/`.
2. Añadir cada imagen y su texto alternativo junto al paso correspondiente.
3. Ejecutar la validación local y el CI.
4. Revisar la visualización en escritorio y móvil.
5. Completar el tracker y adjuntar evidencias de validación.
6. Cambiar `status: review` a `status: validated` únicamente en los manuales que hayan superado todos los controles.
7. Actualizar `updatedAt`, `sourcesVerifiedAt` y el historial del manual.

## Regla de parada

Si un procedimiento no coincide con la interfaz, produce un resultado distinto, exige una actuación irreversible o no dispone de evidencia oficial suficiente, se documenta la desviación y el manual permanece en `review`.
