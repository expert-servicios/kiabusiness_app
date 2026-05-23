# Clasificación Documental Automática — Flujo Kia

> Última actualización: 2026-05-23

## Flujo completo

```
Documento entrante
       │
       ▼
┌─────────────────────────┐
│  Canal de entrada       │
│  WhatsApp / Gmail /     │
│  Portal / Drive / Admin │
└────────────┬────────────┘
             │
             ▼
   Supabase Storage
   (carpeta: documents/{client_id}/)
             │
             ▼
   Registro en tabla `files`
   (o `user_files` / `whatsapp_conversations`)
             │
             ▼
   lib/documents/document-router.ts
   detecta canal y normaliza metadata
             │
             ▼
   lib/documents/document-classifier.ts
   ┌─────────────────────────────────────┐
   │ 1. Analiza nombre de archivo        │
   │ 2. Analiza extensión y MIME         │
   │ 3. Si imagen/PDF → OCR básico       │
   │ 4. Llama a Kia AI con contexto      │
   │ 5. Obtiene: tipo, subtipo,          │
   │    confianza, datos extraídos       │
   └────────────────┬────────────────────┘
                    │
                    ▼
   lib/documents/document-extractor.ts
   (extrae NIF, fechas, importes, etc.)
                    │
                    ▼
   INSERT en `document_classifications`
   con status = 'classified' (o 'needs_review' si confidence < 0.6)
                    │
             ┌──────┴──────┐
             │              │
    confidence ≥ 0.6    confidence < 0.6
             │              │
             ▼              ▼
   Asociar automáticamente  NBA: "Revisar
   a cliente/caso/checklist  documento sin
                             clasificar"
                    │
                    ▼
   Notificar admin si confidence < 0.6
   o si detected_type = 'requerimiento'
```

## Tipos documentales reconocidos

| `detected_type` | Descripción | Prioridad NBA |
|-----------------|-------------|---------------|
| `requerimiento` | Requerimiento AEAT / organismos | CRÍTICA |
| `modelo_aeat` | Modelo 303, 130, 190, 720… | ALTA |
| `factura_emitida` | Factura a cliente | MEDIA |
| `factura_recibida` | Factura de proveedor | MEDIA |
| `dni` | DNI español | BAJA |
| `nie` | NIE (extranjero en España) | BAJA |
| `tie` | Tarjeta de identidad extranjero | BAJA |
| `pasaporte` | Pasaporte | BAJA |
| `datos_fiscales_aeat` | Certificado fiscal AEAT | MEDIA |
| `contrato` | Contrato laboral / arrendamiento | MEDIA |
| `escritura` | Escritura notarial | ALTA |
| `certificado` | Certificado de cualquier tipo | MEDIA |
| `justificante_pago` | Justificante de transferencia o pago | MEDIA |
| `documento_bancario` | Extracto bancario | MEDIA |
| `excel_contable` | Hoja de cálculo contable | ALTA |
| `certificado_digital` | Fichero .p12 / .pfx | ALTA |
| `otros` | No reconocido | BAJA → needs_review |

## Subtypes clave

| `detected_type` | `detected_subtype` ejemplos |
|-----------------|----------------------------|
| `modelo_aeat` | `303` / `130` / `190` / `720` / `100` |
| `factura_emitida` | `simplificada` / `completa` |
| `escritura` | `constitucion` / `compraventa` / `poder` |
| `certificado` | `empadronamiento` / `vida_laboral` / `antecedentes` |

## Asociación automática

Cuando se clasifica un documento, el sistema intenta:

1. **Cliente**: Buscar por NIF/NIE extraído en `profiles.tax_id`.
2. **Expediente**: Buscar caso abierto del mismo cliente con el tipo de documento en su `checklist_json`.
3. **Checklist item**: Marcar `received_documents_json` del caso si hay match.
4. Si no puede asociar: dejar `case_id = null` y generar NBA.

## Datos extraídos por tipo

| `detected_type` | `extracted_data` campos |
|-----------------|------------------------|
| `dni` / `nie` / `tie` / `pasaporte` | `{ nif, nombre, apellidos, fecha_nacimiento, fecha_caducidad }` |
| `factura_emitida` / `factura_recibida` | `{ numero_factura, fecha, emisor_nif, receptor_nif, base_imponible, iva, total }` |
| `modelo_aeat` | `{ modelo, ejercicio, periodo, resultado }` |
| `requerimiento` | `{ organismo, referencia, plazo_respuesta, fecha_notificacion }` |
| `documento_bancario` | `{ entidad, iban_parcial, periodo_desde, periodo_hasta }` |

## Reglas de clasificación manual (admin)

El admin puede:
- Cambiar `detected_type` / `detected_subtype`.
- Cambiar `case_id` (reasignar a otro expediente).
- Cambiar `status` a `corrected` o `rejected`.
- Los campos `reviewed_by` y `reviewed_at` se rellenan automáticamente.

El sistema **nunca** sobrescribe una clasificación con `status = 'corrected'`.

## Señales de reclasificación

Si Kia detecta que una clasificación previa es incorrecta (p.ej., el usuario indica que el documento es otro), puede:
- Marcar la clasificación actual como `needs_review`.
- Crear NBA: "Revisar clasificación incorrecta de documento".
- No puede sobrescribir si `status = 'corrected'`.

## Confidencialidad

- Los documentos se almacenan en Supabase Storage con `bucket = 'documents'`, acceso privado.
- Las URLs son firmadas con TTL de 1 hora máximo.
- Nunca se envían documentos completos a APIs externas sin consentimiento.
- Para OCR/clasificación AI: solo se envía texto extraído o nombre de archivo, no el binario completo.
