// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * GET /api/academy/programa-pdf?slug=<programSlug>
 * Generates and streams a PDF brochure of the academy program (public,
 * no auth required — promotional download, mirrors the style of
 * app/api/reports/[id]/pdf/route.ts).
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { getAcademyProgram, type AcademyProgram } from '@/lib/data/academy-catalog';

const styles = StyleSheet.create({
  page        : { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#3d3528', backgroundColor: '#ffffff' },
  header      : { marginBottom: 20 },
  brand       : { fontSize: 7, color: '#c88b25', fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase' },
  title       : { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#07111d', marginTop: 4, marginBottom: 4 },
  tagline     : { fontSize: 9, color: '#7a6e5f' },
  kpiRow      : { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 6 },
  kpiBox      : { flex: 1, backgroundColor: '#faf9f6', borderRadius: 6, padding: 10, border: '1 solid #e8dfc8' },
  kpiLabel    : { fontSize: 7, color: '#7a6e5f', marginBottom: 3 },
  kpiValue    : { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#07111d' },
  section     : { marginTop: 16 },
  sectionTitle: { fontSize: 8, color: '#c88b25', fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  moduleRow   : { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5 solid #f0e8d8' },
  moduleNum   : { width: 22, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#c88b25' },
  moduleTitle : { flex: 1, fontSize: 8.5, color: '#3d3528' },
  faqQ        : { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#07111d', marginTop: 6 },
  faqA        : { fontSize: 8, color: '#3d3528', marginTop: 2, lineHeight: 1.4 },
  footer      : { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 7, color: '#a89880', textAlign: 'center', borderTop: '0.5 solid #e8dfc8', paddingTop: 6 },
});

function ProgramPDF({ program }: { program: AcademyProgram }) {
  return React.createElement(
    Document,
    { title: `${program.name} — EXPERT Business Academy` },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.brand }, 'EXPERT Business Academy'),
        React.createElement(Text, { style: styles.title }, program.name),
        React.createElement(Text, { style: styles.tagline }, program.tagline),
      ),

      React.createElement(View, { style: styles.kpiRow },
        ...[
          { label: 'Formación', value: `${program.hoursTraining} h` },
          { label: 'Prácticas', value: `${program.hoursInternship} h` },
          { label: 'Precio', value: program.price },
          { label: 'Idiomas', value: program.languages.map((l) => (l === 'es' ? 'Español' : 'Ruso')).join(' / ') },
        ].map(({ label, value }) =>
          React.createElement(View, { key: label, style: styles.kpiBox },
            React.createElement(Text, { style: styles.kpiLabel }, label),
            React.createElement(Text, { style: styles.kpiValue }, value),
          )
        ),
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Programa formativo (16 módulos)'),
        ...program.modules.map((m) =>
          React.createElement(View, { key: m.order, style: styles.moduleRow },
            React.createElement(Text, { style: styles.moduleNum }, String(m.order)),
            React.createElement(Text, { style: styles.moduleTitle }, m.title),
          )
        ),
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Certificación oficial opcional'),
        React.createElement(Text, { style: styles.faqA },
          `${program.officialCertification.code} — ${program.officialCertification.name}. ${program.officialCertification.price}. ${program.officialCertification.requirementsNote}`
        ),
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Preguntas frecuentes'),
        ...program.faqs.map((f) =>
          React.createElement(View, { key: f.q },
            React.createElement(Text, { style: styles.faqQ }, f.q),
            React.createElement(Text, { style: styles.faqA }, f.a),
          )
        ),
      ),

      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, null,
          'EXPERT Business Academy · expertconsulting.es · Documento informativo, no contractual'
        ),
      ),
    )
  );
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const program = slug ? getAcademyProgram(slug) : undefined;

  if (!program) {
    return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(React.createElement(ProgramPDF, { program }));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type'       : 'application/pdf',
      'Content-Disposition': `attachment; filename="programacion-${program.slug}.pdf"`,
    },
  });
}
