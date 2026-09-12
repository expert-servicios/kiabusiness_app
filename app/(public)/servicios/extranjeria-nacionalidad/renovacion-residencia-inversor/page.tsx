import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, BookOpen, Building2, CalendarCheck, CheckCircle2, ExternalLink, FileText, Landmark, Newspaper, ShieldCheck, Users } from 'lucide-react';
import { CalButton } from '@/components/site/CalButton';
import { getCalMeetingUrl } from '@/lib/utils/cal';

const canonicalUrl = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/renovacion-residencia-inversor';
const CAL_REUNION_URL = getCalMeetingUrl();

export const metadata: Metadata = {
  title: 'Renovación residencia inversor Ley 14/2013 · EXPERT Asesoría',
  description:
    'Renovación de residencia de inversor Ley 14/2013 en régimen transitorio. Titular 250 € + IVA y familiares 90 € + IVA por persona. Tasas y certificados aparte.',
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: 'Renovación residencia inversor Ley 14/2013',
    description:
      'Revisión y presentación de renovación de residencia de inversor: inversión inmobiliaria, familiares, SL, seguro, medios económicos y UGE.',
    url: canonicalUrl,
    type: 'website'
  }
};

const included = [
  'Revisión de viabilidad del régimen transitorio.',
  'Checklist documental para titular inversor y familiares.',
  'Revisión de inversión inmobiliaria y notas simples aportadas.',
  'Revisión de seguro médico y medios económicos.',
  'Preparación del expediente de renovación ante UGE.',
  'Instrucciones para tasa 790 código 038.',
  'Presentación telemática cuando el expediente es viable y está completo.',
  'Orientación para la TIE posterior tras resolución favorable.'
];

const notIncluded = [
  'Tasa 790 código 038 de la solicitud.',
  'Tasa 790 código 012 para la TIE posterior.',
  'Notas simples del Registro de la Propiedad.',
  'Certificaciones mercantiles o registrales.',
  'Certificados bancarios, administrativos o de antecedentes penales.',
  'Traducciones juradas, apostillas y legalizaciones.',
  'Informe PRIE o informes oficiales cuando requieran gestión específica.',
  'Recursos administrativos o judiciales en caso de denegación.'
];

const documents = [
  {
    title: 'Titular inversor',
    items: [
      'Solicitud de renovación Ley 14/2013.',
      'Pasaporte completo en vigor.',
      'TIE actual por ambas caras.',
      'Tasa 790 código 038 pagada.',
      'Seguro médico vigente.',
      'Medios económicos suficientes.',
      'Documentación que acredite el mantenimiento de la inversión.',
      'Antecedentes penales si procede por ausencias superiores a seis meses.'
    ]
  },
  {
    title: 'Familiares',
    items: [
      'Solicitud individual de cada familiar.',
      'Pasaporte completo y TIE actual.',
      'Tasa 790 código 038 por cada familiar.',
      'Seguro médico.',
      'Vínculo familiar y dependencia cuando proceda.',
      'Certificado escolar para menores si corresponde.'
    ]
  },
  {
    title: 'Inversión inmobiliaria',
    items: [
      'Notas simples o certificaciones de dominio y cargas recientes.',
      'Escrituras de compraventa si hace falta acreditar valor.',
      'Documentación de cargas hipotecarias, si existen.',
      'Cuadro resumen de inmuebles, valores, titularidad y cargas.'
    ]
  },
  {
    title: 'Persona jurídica / SL',
    items: [
      'NIF de la sociedad.',
      'Escritura de constitución y estatutos vigentes.',
      'Nota simple mercantil o certificación registral.',
      'Certificado de socios, participaciones y derechos de voto.',
      'Documentación que acredite facultad de nombrar o destituir administradores.',
      'Informe oficial de persona jurídica cuando proceda.'
    ]
  }
];

const relatedArticles = [
  {
    title: 'Permiso de residencia para inversores en España: Golden Visa y alternativas',
    href: '/blog/permiso-residencia-inversores',
    excerpt: 'Contexto general sobre residencia por inversión, alternativas y puntos que deben revisarse tras la eliminación de nuevas solicitudes inmobiliarias.'
  },
  {
    title: 'Renovación del permiso de residencia en España: cuándo, cómo y qué necesitas',
    href: '/blog/renovacion-permiso-residencia-espana',
    excerpt: 'Plazos de renovación, documentación, consecuencias de renovar tarde y relación con la continuidad de la residencia legal.'
  },
  {
    title: 'Lista completa de documentos para el permiso de residencia en España',
    href: '/blog/documentos-permiso-residencia-espana',
    excerpt: 'Guía práctica sobre documentos, traducciones, apostillas y errores frecuentes en expedientes de extranjería.'
  }
];

const knowledgeLinks = [
  {
    title: 'Guía de residencia de larga duración nacional',
    href: '/docs/residencia-larga-duracion-nacional',
    excerpt: 'Requisitos de cinco años, ausencias, tasa, documentación y cambio desde autorizaciones temporales.'
  },
  {
    title: 'Nacionalidad española para menor nacido en España',
    href: '/docs/nacionalidad-espanola-menor-nacido-en-espana',
    excerpt: 'Útil cuando el expediente familiar incluye menores y hay que revisar continuidad de residencia legal.'
  },
  {
    title: 'Base de conocimientos EXPERT',
    href: '/docs',
    excerpt: 'Acceso al índice general de guías documentales y trámites relacionados.'
  }
];

const faq = [
  {
    q: '¿Cuánto cuesta el servicio?',
    a: 'Los honorarios son 250 € + IVA para el titular inversor y 90 € + IVA por cada familiar adicional. Tasas, certificados, notas simples, traducciones, apostillas e informes oficiales se pagan aparte.'
  },
  {
    q: '¿Se puede solicitar una nueva golden visa inmobiliaria?',
    a: 'No como solicitud ordinaria nueva. Esta página está orientada a renovaciones de autorizaciones de inversor ya concedidas y vigentes dentro del régimen transitorio.'
  },
  {
    q: '¿La renovación es automática?',
    a: 'No. Hay que acreditar que se mantienen las condiciones que justificaron la autorización inicial: inversión, medios económicos, seguro médico y documentación de familiares cuando proceda.'
  },
  {
    q: '¿Qué ocurre si la inversión está en una SL?',
    a: 'Debe acreditarse que la sociedad conserva los inmuebles y que el solicitante extranjero mantiene el control societario exigido. Puede ser necesario informe oficial de persona jurídica.'
  }
];

export default function RenovacionResidenciaInversorPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Renovación de residencia de inversor Ley 14/2013',
    description:
      'Servicio profesional de revisión, preparación y presentación de renovación de residencia de inversor Ley 14/2013 en régimen transitorio.',
    provider: { '@type': 'Organization', name: 'EXPERT' },
    areaServed: { '@type': 'Country', name: 'España' },
    url: canonicalUrl,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '250',
      priceCurrency: 'EUR',
      offerCount: 2,
      availability: 'https://schema.org/InStock'
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-6xl">
          <Link href="/servicios/extranjeria-nacionalidad" className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]">← Extranjería y Nacionalidad</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <p className="mb-4 inline-flex rounded-md border border-[#D4A017]/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Régimen transitorio Ley 14/2013</p>
              <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">Renovación de residencia de inversor</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">
                Preparamos la renovación de autorizaciones de residencia de inversor ya concedidas al amparo de la Ley 14/2013, revisando inversión, seguro médico, medios económicos, familiares y, cuando proceda, estructura societaria.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/solicitar-presupuesto?servicio=renovacion-residencia-inversor" className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]">Solicitar revisión</Link>
                <Link href="/solicitar-presupuesto?servicio=renovacion-residencia-inversor&tipo=caso-complejo" className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-7 py-3 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]">Presupuesto para caso complejo</Link>
                <CalButton url={CAL_REUNION_URL} fallbackHref="/contacto" className="inline-flex min-h-12 items-center justify-center border border-white/20 px-7 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white">Reunión gratuita 15 min</CalButton>
              </div>
            </div>
            <aside className="border border-white/12 bg-white/5 p-6 shadow-2xl shadow-black/20">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Honorarios</p>
              <div className="mt-5 space-y-4">
                <div className="border border-white/10 bg-white/5 p-4"><p className="text-sm text-white/60">Titular inversor</p><p className="mt-1 text-3xl font-bold text-white">250 € + IVA</p></div>
                <div className="border border-white/10 bg-white/5 p-4"><p className="text-sm text-white/60">Cada familiar adicional</p><p className="mt-1 text-3xl font-bold text-white">90 € + IVA</p></div>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/55">Tasas, certificados, notas simples, traducciones, apostillas, antecedentes penales, informes oficiales y otros costes externos se pagan aparte.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-18"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
        <div className="border border-[#e4d8c1] bg-white p-6"><ShieldCheck className="h-7 w-7 text-[#D4A017]" /><h2 className="mt-4 text-xl font-bold">Renovación, no nueva golden visa</h2><p className="mt-3 text-sm leading-7 text-[#29384A]">El servicio se dirige a autorizaciones de inversor ya concedidas y vigentes dentro del régimen transitorio. No se plantea como nueva solicitud inmobiliaria ordinaria.</p></div>
        <div className="border border-[#e4d8c1] bg-white p-6"><Landmark className="h-7 w-7 text-[#D4A017]" /><h2 className="mt-4 text-xl font-bold">Inversión mantenida</h2><p className="mt-3 text-sm leading-7 text-[#29384A]">Revisamos notas simples, cargas, valores y documentación que permite acreditar que se mantiene la inversión que justificó la autorización inicial.</p></div>
        <div className="border border-[#e4d8c1] bg-white p-6"><Building2 className="h-7 w-7 text-[#D4A017]" /><h2 className="mt-4 text-xl font-bold">Inmuebles en SL</h2><p className="mt-3 text-sm leading-7 text-[#29384A]">Si la inversión está canalizada mediante sociedad, revisamos control societario, derechos de voto, administración e informe oficial de persona jurídica.</p></div>
      </div></section>

      <section className="bg-white px-6 py-14 md:py-18"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Alcance</p><h2 className="mt-3 font-serif text-3xl font-bold">Qué incluye el servicio</h2><div className="mt-8 grid gap-3 sm:grid-cols-2">{included.map((item) => <div key={item} className="flex gap-3 border border-[#eadfca] bg-[#F8F6F1] p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" /><p className="text-sm leading-6 text-[#29384A]">{item}</p></div>)}</div></div><aside className="border border-amber-200 bg-amber-50 p-6"><AlertTriangle className="h-6 w-6 text-amber-700" /><h3 className="mt-4 text-lg font-bold text-amber-950">Costes externos aparte</h3><ul className="mt-4 space-y-2 text-sm leading-6 text-amber-950/80">{notIncluded.map((item) => <li key={item}>• {item}</li>)}</ul></aside></div></section>

      <section className="px-6 py-14 md:py-18"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Documentación</p><h2 className="mt-3 font-serif text-3xl font-bold">Checklist por bloques</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{documents.map((block) => <div key={block.title} className="border border-[#e4d8c1] bg-white p-6"><div className="flex items-center gap-3">{block.title.includes('Familiares') ? <Users className="h-5 w-5 text-[#D4A017]" /> : <FileText className="h-5 w-5 text-[#D4A017]" />}<h3 className="text-lg font-bold">{block.title}</h3></div><ul className="mt-4 space-y-2 text-sm leading-6 text-[#29384A]">{block.items.map((item) => <li key={item}>• {item}</li>)}</ul></div>)}</div></div></section>

      <section className="bg-[#0D1B2A] px-6 py-14 text-white md:py-18"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Elegir vía</p><h2 className="mt-3 font-serif text-3xl font-bold">Solicitud, presupuesto complejo o reunión gratuita</h2><div className="mt-8 grid gap-5 md:grid-cols-3"><div className="border border-white/10 bg-white/5 p-6"><CheckCircle2 className="h-6 w-6 text-[#D4A017]" /><h3 className="mt-4 text-lg font-bold">Caso estándar</h3><p className="mt-3 text-sm leading-6 text-white/60">Titular inversor y familiares con documentación clara, inversión mantenida y sin incidencias relevantes.</p><Link href="/solicitar-presupuesto?servicio=renovacion-residencia-inversor" className="mt-5 inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]">Solicitar revisión</Link></div><div className="border border-white/10 bg-white/5 p-6"><Building2 className="h-6 w-6 text-[#D4A017]" /><h3 className="mt-4 text-lg font-bold">Caso complejo</h3><p className="mt-3 text-sm leading-6 text-white/60">SL, varios inmuebles, sociedades extranjeras, cambios de titularidad, ausencias largas, informes PRIE o antecedentes penales.</p><Link href="/solicitar-presupuesto?servicio=renovacion-residencia-inversor&tipo=caso-complejo" className="mt-5 inline-flex min-h-11 items-center justify-center border border-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]">Solicitar presupuesto</Link></div><div className="border border-white/10 bg-white/5 p-6"><CalendarCheck className="h-6 w-6 text-[#D4A017]" /><h3 className="mt-4 text-lg font-bold">Reunión gratuita</h3><p className="mt-3 text-sm leading-6 text-white/60">Primera reunión orientativa de 15 minutos para ubicar el caso y decidir si conviene presupuesto cerrado o revisión previa.</p><CalButton url={CAL_REUNION_URL} fallbackHref="/contacto" className="mt-5 inline-flex min-h-11 items-center justify-center border border-white/25 px-5 py-2.5 text-sm font-bold text-white/85 hover:border-white/60 hover:text-white">Reservar 15 minutos</CalButton></div></div></div></section>

      <section className="bg-white px-6 py-14 md:py-18"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Lecturas relacionadas</p><h2 className="mt-3 font-serif text-3xl font-bold">Artículos útiles del blog</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{relatedArticles.map((article) => <Link key={article.href} href={article.href} className="group border border-[#e4d8c1] bg-[#F8F6F1] p-6 transition hover:border-[#D4A017] hover:bg-white"><Newspaper className="h-6 w-6 text-[#D4A017]" /><h3 className="mt-4 text-lg font-bold leading-snug group-hover:text-[#B97A13]">{article.title}</h3><p className="mt-3 text-sm leading-6 text-[#29384A]">{article.excerpt}</p></Link>)}</div></div></section>

      <section className="px-6 py-14 md:py-18"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Base de conocimientos</p><h2 className="mt-3 font-serif text-3xl font-bold">Guías de ayuda relacionadas</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{knowledgeLinks.map((doc) => <Link key={doc.href} href={doc.href} className="group border border-[#e4d8c1] bg-white p-6 transition hover:border-[#D4A017]"><BookOpen className="h-6 w-6 text-[#D4A017]" /><h3 className="mt-4 text-lg font-bold leading-snug group-hover:text-[#B97A13]">{doc.title}</h3><p className="mt-3 text-sm leading-6 text-[#29384A]">{doc.excerpt}</p></Link>)}</div></div></section>

      <section className="bg-[#0D1B2A] px-6 py-14 text-white md:py-18"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Fuentes oficiales</p><h2 className="mt-3 font-serif text-3xl font-bold">Enlaces de referencia</h2><div className="mt-8 grid gap-4 md:grid-cols-2"><a className="border border-white/10 bg-white/5 p-5 hover:border-[#D4A017]/50" href="https://ciudadaniaexterior.inclusion.gob.es/web/unidadgrandesempresas/inversores" target="_blank" rel="noreferrer"><span className="flex items-center gap-2 font-bold">UGE — Inversores <ExternalLink className="h-4 w-4" /></span><p className="mt-2 text-sm leading-6 text-white/60">Información oficial sobre inversores y régimen transitorio.</p></a><a className="border border-white/10 bg-white/5 p-5 hover:border-[#D4A017]/50" href="https://www.inclusion.gob.es/documents/1823432/1826095/renovaciones_feb_2018.pdf/7e4b1631-3f10-171a-eb21-5119133d01a5?t=1664875009918" target="_blank" rel="noreferrer"><span className="flex items-center gap-2 font-bold">UGE — Renovaciones Ley 14/2013 <ExternalLink className="h-4 w-4" /></span><p className="mt-2 text-sm leading-6 text-white/60">Documentación orientativa oficial para renovaciones.</p></a><a className="border border-white/10 bg-white/5 p-5 hover:border-[#D4A017]/50" href="https://www.boe.es/buscar/act.php?id=BOE-A-2013-10074" target="_blank" rel="noreferrer"><span className="flex items-center gap-2 font-bold">BOE — Ley 14/2013 <ExternalLink className="h-4 w-4" /></span><p className="mt-2 text-sm leading-6 text-white/60">Texto consolidado de la Ley 14/2013.</p></a><a className="border border-white/10 bg-white/5 p-5 hover:border-[#D4A017]/50" href="https://comercio.gob.es/es-es/inversiones_exteriores/movilidadinternacional/Paginas/default.aspx" target="_blank" rel="noreferrer"><span className="flex items-center gap-2 font-bold">PRIE — Ministerio de Economía <ExternalLink className="h-4 w-4" /></span><p className="mt-2 text-sm leading-6 text-white/60">Programa de Residencia para Inversores y Emprendedores e informes oficiales.</p></a></div></div></section>

      <section className="px-6 py-14 md:py-18"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">Preguntas frecuentes</p><div className="mt-6 divide-y divide-[#eadfca] border border-[#eadfca] bg-white">{faq.map((item) => <details key={item.q} className="group p-5"><summary className="cursor-pointer text-base font-bold text-[#0D1B2A]">{item.q}</summary><p className="mt-3 text-sm leading-7 text-[#29384A]">{item.a}</p></details>)}</div><div className="mt-10 border border-[#e4d8c1] bg-white p-6 text-center"><h2 className="font-serif text-2xl font-bold">¿Necesitas renovar una residencia de inversor?</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#29384A]">Revisamos la autorización inicial, la inversión mantenida, familiares, tasas y documentación antes de presentar ante UGE.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/solicitar-presupuesto?servicio=renovacion-residencia-inversor&tipo=caso-complejo" className="inline-flex min-h-12 items-center justify-center bg-[#0D1B2A] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#23364D]">Solicitar presupuesto</Link><CalButton url={CAL_REUNION_URL} fallbackHref="/contacto" className="inline-flex min-h-12 items-center justify-center border border-[#0D1B2A] px-7 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#0D1B2A] hover:text-white">Reunión gratuita 15 min</CalButton></div></div></div></section>
    </main>
  );
}
