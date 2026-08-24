---
title: "Holded y SILTRA: liquidación mensual, respuestas, RNT y RLC"
slug: holded-siltra-liquidacion
category: laboral
module: 7
access: student
status: review
updatedAt: 2026-08-24
readTime: 35 min
tags: [Holded, SILTRA, SLD, RNT, RLC, DCL, CRA]
sourcesVerifiedAt: 2026-08-24
---

# Holded y SILTRA: liquidación mensual, respuestas, RNT y RLC

## Finalidad

Generar datos de cotización en Holded, transmitirlos mediante SILTRA, gestionar respuestas y cerrar con RNT y RLC definitivos.

## Flujo real

`Holded → fichero de bases → SILTRA → TGSS → respuesta → corrección → DCL → confirmación → RNT/RLC → Holded y archivo`

Holded prepara el intercambio, pero su documentación vigente indica que el fichero se descarga y se envía a SILTRA fuera de Holded.

## Requisitos

- centro con administración, convenio, CNAE, régimen y CCC;
- autorización informada y NAF de cada empleado;
- contratos aprobados, no solo activos;
- nóminas e incidencias revisadas;
- SILTRA actualizado y configurado.

## Procedimiento en Holded

1. Ir a **RR. HH. > Obligaciones > SILTRA**.
2. Pulsar **Nueva liquidación**.
3. Indicar paga, periodo y tipo.
4. Crear la liquidación y abrir **Nuevo envío**.
5. Revisar centros, trabajadores y tramos.
6. Descargar el fichero.

Si falta un trabajador, revisar contrato aprobado, NAF, centro y configuración contractual.

## Procedimiento en SILTRA

1. Comprobar versión y entorno.
2. Validar el fichero y transmitirlo.
3. Guardar justificante del envío.
4. Recibir y procesar mensajes de TGSS.
5. Identificar liquidación, CCC, trabajador, tramo y error.
6. Corregir el dato de origen, no solo el XML.
7. Regenerar y reenviar cuando proceda.
8. Subir a Holded la respuesta del último envío.
9. Revisar DCL antes de confirmar.
10. Obtener RNT y RLC, comprobar pago, conciliar y archivar.

## L03

Holded documenta un flujo específico para L03 cuando un bonus tiene periodo de devengo distinto del mes de cobro. No debe tratarse como una L00 ordinaria.

## Errores frecuentes

- contrato activo pero no aprobado;
- respuesta de un envío anterior;
- confirmar sin revisar DCL;
- modificar el XML sin corregir el origen;
- confundir bases, CRA, RNT y RLC;
- no comprobar modalidad de pago.

## Recursos

[![Instalación de SILTRA](https://img.youtube.com/vi/4dNXjqWqyzc/hqdefault.jpg)](https://www.youtube.com/watch?v=4dNXjqWqyzc)

El vídeo es antiguo y solo sirve como apoyo conceptual. Prevalece el manual vigente.

- [Holded Academy: gestionar ficheros SILTRA](https://help.holded.com/es/articles/14321260-como-gestionar-los-ficheros-siltra-desde-holded)
- [Holded Academy: generar L03](https://help.holded.com/es/articles/16310106-como-generar-el-fichero-l03-en-holded)
- [TGSS: manuales SILTRA](https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/5300/2837/2838/2840/196800?changeLanguage=es)
- [TGSS: especificaciones SLD](https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/5300/2837/2838/2841?changeLanguage=es)

## Historial de cambios

- 2026-08-24: flujo actualizado con TGSS y Holded Academy.
