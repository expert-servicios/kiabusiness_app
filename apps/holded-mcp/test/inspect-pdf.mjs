const key = process.argv[2];
const res = await fetch(
  'https://api.holded.com/api/invoicing/v1/documents/invoice/69cfbca89b6dcce3bb02740b/pdf',
  { headers: { key, 'Accept-Encoding': 'identity', Accept: 'application/json' } }
);
const json = await res.json();
const buf = Buffer.from(json.data, 'base64');
console.log('Decoded bytes:', buf.length);

// Scan first 500 bytes for %PDF magic
let pdfOffset = -1;
for (let i = 0; i < Math.min(buf.length, 500); i++) {
  if (buf[i] === 0x25 && buf[i+1] === 0x50 && buf[i+2] === 0x44 && buf[i+3] === 0x46) {
    pdfOffset = i; break;
  }
}

console.log('Headers (first 250 bytes as hex dump):');
for (let i = 0; i < Math.min(250, buf.length); i += 16) {
  const chunk = buf.slice(i, i + 16);
  const hex   = [...chunk].map(b => b.toString(16).padStart(2,'0')).join(' ');
  const ascii = [...chunk].map(b => b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.').join('');
  console.log(`  ${i.toString().padStart(4)}: ${hex.padEnd(48)}  ${ascii}`);
  if (i >= pdfOffset && pdfOffset >= 0) break;
}

console.log(`\n%PDF found at byte offset: ${pdfOffset}`);
if (pdfOffset >= 0) {
  const pdfBuf = buf.slice(pdfOffset);
  console.log(`PDF size: ${pdfBuf.length} bytes`);
  console.log(`First 12 bytes of PDF: "${pdfBuf.slice(0,12).toString('latin1').replace(/[^\x20-\x7e]/g,'.')}"`)
  // Show the byte just before %PDF
  if (pdfOffset > 0) {
    const before = buf.slice(Math.max(0, pdfOffset-4), pdfOffset);
    console.log(`Bytes before %PDF: ${[...before].map(b=>b.toString(16).padStart(2,'0')).join(' ')}`);
  }
}
