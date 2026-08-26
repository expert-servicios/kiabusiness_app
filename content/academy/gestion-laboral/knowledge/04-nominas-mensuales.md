---
title: Gestión mensual de nóminas en Holded
slug: nominas-mensuales
category: laboral
module: 6
access: student
status: review
updatedAt: 2026-08-24
readTime: 45 min
tags: [Holded, nómina, incidencias, IRPF, SEPA, contabilidad]
tools: [Holded Nóminas, Holded Tesorería]
sourcesVerifiedAt: 2026-08-24
reviewCycleDays: 60
---

# Gestión mensual de nóminas en Holded

## Finalidad

Cerrar incidencias, generar borradores, revisar cálculos, aprobar, pagar y contabilizar nóminas sin perder trazabilidad.

## Requisitos

- configuración y contratos aprobados;
- calendario de incidencias cerrado;
- altas, bajas y variaciones comunicadas;
- horas, festivos, nocturnidad, vacaciones y ausencias;
- IT y otras situaciones coordinadas con proveedor;
- variables, bonus, anticipos o embargos documentados;
- datos IRPF actualizados.

## Procedimiento

### 1. Cerrar incidencias

1. Fijar fecha límite y responsable.
2. Recibir y validar variables.
3. Registrar cada concepto en la ficha o Centro de Modificaciones.
4. Informar periodo de devengo y cobro de bonus.
5. Verificar ausencias y cambios contractuales.
6. Emitir listado de incidencias aprobadas.

### 2. Preparar conceptos

1. Abrir **RR. HH. > Empleados > Editar > Nómina**.
2. Revisar conceptos precargados y cantidades.
3. Distinguir cotiza/tributa, solo cotiza, solo tributa, descuento y exento.
4. Revisar pagas y retención.
5. Guardar.

Si no existen conceptos/cantidades, Holded puede generar una nómina a cero.

### 3. Generar borradores

1. Ir a **RR. HH. > Nóminas > Nueva nómina**.
2. Elegir año, mes, centro, equipo y empleados.
3. Pulsar **Crear borrador**.
4. Revisar cada empleado individualmente.

Solo puede existir un borrador por persona y periodo; crear uno nuevo sustituye el anterior. Guardar el control de cambios fuera del PDF si se requiere trazabilidad.

### 4. Revisar

Comprobar:

- periodo, días y jornada;
- devengos dinerarios y en especie;
- salario, pagas, horas y variables;
- bases de contingencias y desempleo;
- aportaciones, MEI y otras deducciones;
- IRPF y regularización;
- anticipos/embargos;
- líquido;
- coste empresa y asiento previsto;
- variación frente al mes anterior.

El PDF de borrador conserva marca de agua y no debe entregarse como definitivo.

### 5. Aprobar

1. Resolver todas las incidencias.
2. Obtener visto bueno del responsable.
3. Seleccionar borradores y pulsar **Aprobar**.
4. Descargar PDF definitivo.
5. Revisar asiento automático.

La aprobación lleva retenciones a los modelos 111/190 y habilita la remesa; no aprobar antes de terminar el control.

### 6. Pagar y conciliar

1. Crear remesa en **Tesorería > Remesas**.
2. Seleccionar nóminas e IBAN.
3. Descargar SEPA y subirlo al banco.
4. Autorizar el pago fuera de Holded.
5. Conciliar el movimiento bancario.
6. Marcar como pagada cuando exista evidencia.
7. Facilitar el recibo mediante Mi zona o canal seguro.

### 7. Recurrencias

Usarlas solo para escenarios estables. La recurrencia genera borradores que siguen requiriendo revisión; no equivale a aprobación automática.

## Bonus y L03

Si devengo y cobro no coinciden, registrar ambas fechas. Holded genera nómina separada y puede preparar L03; después se descarga, transmite en SILTRA e importa la respuesta. No eliminar un bonus vinculado sin resolver primero la nómina asociada.

## Capturas

- `holded-nomina-01-centro-modificaciones-2026-08.webp`
- `holded-nomina-02-nueva-nomina-2026-08.webp`
- `holded-nomina-03-borrador-detalle-2026-08.webp`
- `holded-nomina-04-aprobacion-2026-08.webp`
- `holded-nomina-05-pdf-asiento-2026-08.webp`
- `holded-nomina-06-remesa-sepa-2026-08.webp`

## Checklist

- [ ] Incidencias cerradas y autorizadas.
- [ ] Altas/bajas/variaciones reflejadas.
- [ ] Borrador revisado trabajador por trabajador.
- [ ] Diferencias frente al mes anterior explicadas.
- [ ] IRPF y bases coherentes.
- [ ] PDF definitivo y asiento revisados.
- [ ] Remesa autorizada y banco conciliado.
- [ ] Recibos entregados por canal seguro.

## Errores y escalado

Errores: nómina cero, duplicar variables, aprobar prematuramente, confundir devengo/cobro, pagar antes de revisar o marcar como pagada sin banco. Escalar IT compleja, embargo, atrasos, especie, bonus plurianual, retribución flexible, maternidad parcial o diferencias de bases.

## Fuentes

- [Holded Academy: crear una nómina](https://help.holded.com/es/articles/15888009-como-crear-una-nomina-en-holded)
- [Nóminas masivas y recurrencias](https://help.holded.com/es/articles/13385991-como-crear-varias-nominas-a-la-vez-y-definir-recurrencias)
- [Bonus y L03](https://help.holded.com/es/articles/16310109-bonus-y-fichero-l03-que-es-y-como-funciona)

## Historial

- 2026-08-24: SOP de cierre mensual actualizado a Holded 2026.
