# Manifiesto de capturas de la base laboral

Estado: **pendiente de sesión funcional autorizada**.

Documentos de ejecución:

- [Protocolo de capturas y validación funcional](./CAPTURE_VALIDATION_RUNBOOK.md)
- [Registro de las 58 ubicaciones](./CAPTURE_VALIDATION_TRACKER.csv)

## Volumen previsto

| Manual | Herramienta | Capturas mínimas |
|---|---|---:|
| 01 Configuración | Holded | 15 |
| 02 Convenio | Holded | 5 |
| 03 Alta y contrato | DelegaRed/NetContrata/Holded | 7 |
| 04 Nómina | Holded | 6 |
| 05 Cotización | Holded/SILTRA | 7 |
| 06 Variaciones | Creative Quality/Holded | 6 |
| 07 Baja y finiquito | Creative Quality/Holded/Certific@2 | 7 |
| 08 Cierre | Holded | 5 |
| **Total mínimo** |  | **58** |

## Directorios

```text
public/images/docs/laboral/
├── holded/
├── delegared/
├── netcontrata/
├── sistema-red/
├── siltra/
└── certifica2/
```

## Flujo de producción

1. Crear empresa y trabajadores ficticios.
2. Ejecutar el procedimiento completo.
3. Capturar solo la zona útil de la interfaz.
4. Comprobar que no aparecen datos reales ni secretos.
5. Convertir a WebP con calidad legible.
6. Guardar con el nombre definido en el manual.
7. Añadir imagen y texto alternativo al Markdown.
8. Revisar móvil y escritorio.
9. Registrar fecha, versión y revisor.
10. Cambiar a `validated` únicamente tras comprobar el resultado oficial.

## Criterios de rechazo

- datos personales o empresariales reales;
- certificados, NAF, CCC, IBAN o autorizaciones visibles;
- captura desactualizada;
- imagen sin relación con el paso;
- texto ilegible;
- pantalla reconstruida o inventada;
- material de tercero sin permiso.

## Prioridad

1. Holded configuración, nómina y SILTRA.
2. DelegaRed/NetContrata alta y contrato.
3. SILTRA respuesta, DCL, RNT y RLC.
4. Baja, finiquito y Certific@2.
5. Variaciones y cierres.
