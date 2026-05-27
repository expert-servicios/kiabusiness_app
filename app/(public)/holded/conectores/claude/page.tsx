import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileText, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';

const MCP_BASE_URL = process.env.NEXT_PUBLIC_HOLDED_MCP_BASE_URL ?? 'https://claude.expertconsulting.es';
const MCP_URL = `${MCP_BASE_URL.replace(/\/$/, '')}/mcp`;
const CLAUDE_CONNECT_URL = `https://claude.ai/customize/connectors?${new URLSearchParams({
  modal: 'add-custom-connector',
  connectorName: 'Holded',
  connectorUrl: MCP_URL,
}).toString()}`;

export const metadata: Metadata = {
  title: 'Conector Claude para Holded | EXPERT',
  description:
    'Conecta Holded con Claude para consultar facturas, contactos, contabilidad y crear borradores revisables con límites seguros.',
  alternates: { canonical: 'https://expertconsulting.es/holded/conectores/claude' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/holded/conectores/claude',
    title: 'Conector Claude para Holded | EXPERT',
    description: 'Consulta Holded desde Claude con OAuth, modo lectura y borradores con confirmación.',
    images: [{ url: 'https://expertconsulting.es/catalog/holded.png', width: 1200, height: 630, alt: 'Conector Claude para Holded' }],
  },
};

const capabilities = [
  'Consultar facturas, presupuestos y PDFs existentes.',
  'Revisar contactos, productos, stock y series cuando estén disponibles.',
  'Leer plan contable, diario y datos operativos sin modificar Holded.',
  'Crear solo borradores de factura, nunca emitir ni enviar automáticamente.',
];

const limits = [
  'No mueve dinero.',
  'No presenta impuestos.',
  'No borra documentos.',
  'No modifica contabilidad sin revisión humana.',
];

export default function HoldedClaudeConnectorPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Holded x Claude</p>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-6xl">
            Pregunta a Holded desde Claude con límites seguros.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#C9D1D9] md:text-lg">
            Un conector MCP separado de EXPERT que permite a Claude consultar tu cuenta de Holded mediante OAuth. La superficie es conservadora: lectura por defecto y borradores revisables cuando hay escritura.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={CLAUDE_CONNECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Conectar con Claude <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/holded/conectores/claude/docs"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10"
            >
              Ver documentación
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-[#D4A017]/25 bg-white p-8">
            <Sparkles className="h-8 w-8 text-[#D4A017]" />
            <h2 className="mt-4 font-serif text-2xl font-bold">Qué puede hacer</h2>
            <ul className="mt-6 space-y-3">
              {capabilities.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-[#23364D]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#D4A017]/25 bg-[#0D1B2A] p-8 text-[#F8F6F1]">
            <ShieldCheck className="h-8 w-8 text-[#D4A017]" />
            <h2 className="mt-4 font-serif text-2xl font-bold">Límites no negociables</h2>
            <ul className="mt-6 space-y-3">
              {limits.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-[#C9D1D9]">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Información legal</p>
          <h2 className="mt-4 font-serif text-3xl font-bold">Transparencia antes de conectar</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Documentación', '/holded/conectores/claude/docs'],
              ['Privacidad', '/holded/conectores/claude/privacy'],
              ['DPA', '/holded/conectores/claude/dpa'],
              ['Términos', '/holded/conectores/claude/terms'],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="flex items-center gap-3 border border-[#D4A017]/20 bg-[#F8F6F1] p-4 text-sm font-bold text-[#0D1B2A] transition hover:border-[#D4A017]">
                <FileText className="h-4 w-4 text-[#D4A017]" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
