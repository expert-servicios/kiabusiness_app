---
title: Cierre laboral mensual, trimestral y anual
slug: cierre-laboral
category: laboral
module: 9
access: student
status: review
updatedAt: 2026-08-24
readTime: 35 min
tags: [cierre, conciliación, modelo 111, modelo 190, archivo]
tools: [Holded, SILTRA, AEAT, banco]
sourcesVerifiedAt: 2026-08-24
reviewCycleDays: 90
---

# Cierre laboral mensual, trimestral y anual

## Finalidad

Demostrar que plantilla, nóminas, cotización, banco, contabilidad, retenciones y justificantes coinciden.

## Cierre mensual

1. Obtener relación de trabajadores y movimientos.
2. Confirmar que todas las nóminas están aprobadas y entregadas.
3. Revisar pagos y conciliación bancaria.
4. Comparar total devengado, deducciones y líquido con contabilidad.
5. Comparar coste empresarial con asientos.
6. Revisar RNT: personas y tramos.
7. Revisar RLC: cuota, pago y modalidad.
8. Confirmar respuestas y justificantes SILTRA.
9. Revisar acumulados de IRPF.
10. Cerrar incidencias o trasladarlas con responsable y fecha.

## Cierre trimestral: modelo 111

1. Ir a **Impuestos > Mostrar todos > Modelo 111**.
2. Seleccionar periodo correcto.
3. Conciliar perceptores, bases y retenciones de nóminas/finiquitos y otras operaciones incluidas.
4. Comparar acumulados con contabilidad.
5. Revisar complementarias o correcciones.
6. Presentar mediante el flujo configurado o en AEAT.
7. Si se presenta fuera, marcar **Presentado por otra plataforma** y adjuntar justificante.
8. Registrar pago y asiento cuando proceda.

No aplicar porcentajes genéricos: el 111 recoge retenciones efectivamente practicadas según cada rendimiento.

## Cierre anual: modelo 190

1. Cerrar todos los periodos y regularizaciones.
2. Conciliar suma de 111 con acumulados anuales, considerando ajustes.
3. Revisar identificación y claves/subclaves de perceptores.
4. Verificar percepciones dinerarias/en especie, retenciones e ingresos a cuenta.
5. Validar fichero o borrador.
6. Presentar y archivar justificante.
7. Generar certificados anuales.
8. Entregar por canal seguro.

## Expediente de cierre

```text
AAAA/MM/
├── 01-nominas/
├── 02-remesa-y-banco/
├── 03-siltra-respuestas/
├── 04-rnt-rlc/
├── 05-contabilidad/
├── 06-impuestos/
└── 07-checklist-incidencias/
```

## Cuadro de conciliación

| Control | Fuente A | Fuente B | Diferencia permitida |
|---|---|---|---:|
| líquido | nóminas | banco/remesa | 0 € |
| retenciones | nóminas | 111/190 | 0 € o ajuste documentado |
| trabajadores/tramos | Holded | RNT | 0 pendientes |
| cuota | RLC | contabilidad/banco | 0 € |
| coste | nóminas | asiento | 0 € o redondeo documentado |

## Capturas

- `holded-cierre-01-listado-nominas-2026-08.webp`
- `holded-cierre-02-asiento-2026-08.webp`
- `holded-impuestos-01-modelo-111-2026-08.webp`
- `holded-impuestos-02-presentado-otra-plataforma-2026-08.webp`
- `holded-impuestos-03-modelo-190-2026-08.webp`

## Checklist

- [ ] Nóminas aprobadas, entregadas y pagadas.
- [ ] Banco conciliado.
- [ ] RNT/RLC y SILTRA cerrados.
- [ ] Contabilidad coincide.
- [ ] Retenciones acumuladas revisadas.
- [ ] 111/190 presentados y justificados cuando proceda.
- [ ] Certificados entregados.
- [ ] Incidencias con responsable y fecha.
- [ ] Expediente protegido y completo.

## Errores y escalado

Errores: marcar presentado sin justificante, cuadrar solo totales, ignorar diferencias por trabajador, no conciliar banco o mezclar periodos. Escalar discrepancias materiales, complementarias, perceptores duplicados, claves dudosas, pagos fuera de plazo o diferencias TGSS-AEAT.

## Fuentes

- [Holded Academy: modelo 111](https://help.holded.com/es/articles/6924901-modelo-111-que-tener-en-cuenta)
- [Holded Academy: crear nómina](https://help.holded.com/es/articles/15888009-como-crear-una-nomina-en-holded)
- [TGSS: manuales SILTRA](https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/5300/2837/2838/2840/196800?changeLanguage=es)

## Historial

- 2026-08-24: SOP de cierre y conciliación integral.
