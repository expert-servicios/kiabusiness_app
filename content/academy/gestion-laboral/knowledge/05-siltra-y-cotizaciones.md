---
title: Cotización mensual con Holded y SILTRA
slug: siltra-cotizaciones
category: laboral
module: 7
access: student
status: review
updatedAt: 2026-08-24
readTime: 50 min
tags: [SILTRA, Sistema de Liquidación Directa, CRA, DCL, RNT, RLC]
tools: [Holded Nóminas, SILTRA, Sistema RED]
sourcesVerifiedAt: 2026-08-24
reviewCycleDays: 60
---

# Cotización mensual con Holded y SILTRA

## Finalidad

Preparar bases en Holded, transmitirlas en SILTRA, resolver discrepancias y cerrar con RNT/RLC y pago controlado.

## Flujo

`Nóminas revisadas → liquidación Holded → fichero → SILTRA → respuesta TGSS → corrección → DCL → confirmación → RNT/RLC → conciliación`

## Requisitos

- SILTRA instalado y actualizado;
- autorización, certificado y directorios configurados;
- centro, administración, convenio, CNAE, régimen y CCC;
- NAF y contratos aprobados;
- nóminas e incidencias cerradas;
- afiliación, IT y tramos actualizados.

## Procedimiento

### 1. Preparar Holded

1. Conciliar plantilla del mes con altas/bajas.
2. Revisar contratos aprobados y NAF.
3. Comparar bases de nómina con incidencias.
4. Ir a **RR. HH. > Obligaciones > SILTRA**.
5. Pulsar **Nueva liquidación**.
6. Elegir paga, periodo y tipo de liquidación.
7. Crear y abrir **Nuevo envío**.
8. Revisar centros, empleados y tramos.
9. Descargar el fichero.

### 2. Validar y transmitir en SILTRA

1. Confirmar entorno real y versión.
2. Seleccionar el fichero del periodo y CCC correctos.
3. Validar antes de enviar.
4. Transmitir.
5. Guardar justificante con fecha y huella.
6. Procesar respuestas de TGSS.

Holded no realiza la transmisión: su documentación exige descargar el fichero y enviarlo fuera de Holded.

### 3. Resolver respuestas

1. Asociar respuesta al último envío.
2. Leer estado general y detalle por trabajador/tramo.
3. Clasificar: dato de afiliación, contrato, incidencia, base o formato.
4. Corregir el sistema de origen.
5. Regenerar fichero.
6. Reenviar y conservar la secuencia.
7. Subir a Holded la respuesta válida.

No editar manualmente el XML salvo procedimiento técnico autorizado y documentado.

### 4. Revisar y confirmar

1. Obtener y revisar DCL/cálculos.
2. Comparar bases y cuotas con nómina y mes anterior.
3. Confirmar solo sin discrepancias pendientes.
4. Descargar RNT y RLC definitivos.
5. Comprobar modalidad y fecha de pago.
6. Incorporar documentos a Holded y expediente.

### 5. Conciliar

1. Totalizar coste empresa y aportaciones.
2. Comparar RNT con plantilla y tramos.
3. Comparar RLC con asiento y pago.
4. Documentar diferencias y ajustes.
5. Cerrar checklist mensual.

## L03, L13 y otros tipos

- **L00:** liquidación ordinaria.
- **L03:** incrementos/atrasos o bonus con devengo distinto, conforme al supuesto.
- **L13:** vacaciones retribuidas y no disfrutadas tras baja, cuando proceda.

No seleccionar el tipo por analogía. Revisar causa, periodo, plazo y datos exigidos por TGSS.

## CRA

Revisar todos los conceptos abonados, códigos, importes y periodos. La generación automática no sustituye comprobar la correspondencia entre concepto de nómina y código CRA.

## Capturas

- `holded-siltra-01-nueva-liquidacion-2026-08.webp`
- `holded-siltra-02-nuevo-envio-2026-08.webp`
- `siltra-01-validacion-fichero-2026-08.webp`
- `siltra-02-envio-justificante-2026-08.webp`
- `siltra-03-respuesta-errores-2026-08.webp`
- `siltra-04-dcl-confirmacion-2026-08.webp`
- `siltra-05-rnt-rlc-2026-08.webp`

## Checklist

- [ ] Plantilla y tramos revisados.
- [ ] Contratos aprobados y NAF completos.
- [ ] Fichero correcto validado.
- [ ] Justificante de envío archivado.
- [ ] Última respuesta incorporada.
- [ ] Discrepancias resueltas en origen.
- [ ] DCL revisado antes de confirmar.
- [ ] RNT/RLC definitivos archivados.
- [ ] Modalidad de pago comprobada.
- [ ] RLC, asiento y banco conciliados.

## Errores y escalado

Errores: trabajador omitido, tramo incorrecto, respuesta antigua, confirmar prematuramente, pago equivocado o confundir CRA/RNT/RLC. Escalar diferencias persistentes, periodos retroactivos, liquidaciones complementarias dudosas, rectificaciones o deuda.

## Fuentes

- [Holded Academy: gestionar SILTRA](https://help.holded.com/es/articles/14321260-como-gestionar-los-ficheros-siltra-desde-holded)
- [Holded Academy: generar L03](https://help.holded.com/es/articles/16310106-como-generar-el-fichero-l03-en-holded)
- [TGSS: Manual SILTRA y manuales SLD](https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/5300/2837/2838/2840/196800?changeLanguage=es)
- [TGSS: especificaciones técnicas SLD](https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/5300/2837/2838/2841?changeLanguage=es)

## Historial

- 2026-08-24: SOP integral Holded-SILTRA-TGSS.
