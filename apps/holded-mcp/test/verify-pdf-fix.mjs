// Simula exactamente la lógica corregida en getDocumentPdf
const key = process.argv[2];
const res = await fetch(
  'https://api.holded.com/api/invoicing/v1/documents/invoice/69cfbca89b6dcce3bb02740b/pdf',
  { headers: { key, 'Accept-Encoding': 'identity', Accept: 'application/json' } }
);
const response = await res.json();
const b64 = (response?.data && typeof response.data === 'string') ? response.data : null;
if (!b64) { console.error('No data field'); process.exit(1); }

const raw = Buffer.from(b64, 'base64');
const pdfOffset = raw.indexOf(Buffer.from([0x25, 0x50, 0x44, 0x46]));
if (pdfOffset < 0) { console.error('No %PDF magic found'); process.exit(1); }

const pdfBuf = raw.slice(pdfOffset);
console.log(`✅ PDF extraído correctamente:`);
console.log(`   Offset del %PDF en raw: ${pdfOffset}`);
console.log(`   Tamaño PDF: ${pdfBuf.length} bytes`);
console.log(`   Magic primeros 8 bytes: "${pdfBuf.slice(0,8).toString('ascii').replace(/[^\x20-\x7e]/g,'.')}"`);
console.log(`   Es PDF válido: ${pdfBuf.slice(0,4).toString() === '%PDF'}`);
console.log(`   Base64 para el LLM: ${pdfBuf.toString('base64').slice(0, 40)}...`);
