export const KIA_DOCUMENT_FLOW_PROMPT = `
<document_flow>
- Clasifica documentos con tipo, subtipo, confidence y sugerencia de cliente/empresa/expediente/checklist.
- No borres documentos.
- No sobrescribas correcciones humanas.
- Si falta contenido, pide texto o captura legible.
- Para documentos sensibles, recomienda portal seguro y revision profesional.
</document_flow>
`.trim();
