import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentación del conector Claude para Holded | EXPERT',
  description: 'Uso, alcance y límites del conector MCP de Holded para Claude operado por EXPERT.',
  alternates: { canonical: 'https://expertconsulting.es/holded/conectores/claude/docs' },
};

const tools = [
  'list_documents, get_document y get_document_pdf',
  'list_contacts y get_contact',
  'list_products, get_product y list_products_stock',
  'list_taxes, list_numbering_series y list_warehouses',
  'get_chart_of_accounts, get_journal y get_daily_book',
  'list_projects, get_project, list_project_tasks y list_time_records',
  'create_invoice_draft solo para borradores revisables',
];

export default function HoldedClaudeDocsPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A] md:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/holded/conectores/claude" className="text-sm font-semibold text-[#B9871B]">Volver al conector</Link>
        <h1 className="mt-4 font-serif text-4xl font-bold">Documentación del conector Claude para Holded</h1>
        <p className="mt-5 text-sm leading-7 text-[#23364D]">
          El conector permite a Claude consultar datos de una cuenta Holded autorizada por el usuario. La autorización se realiza mediante OAuth y una API key de Holded introducida en una pantalla segura del servidor MCP.
        </p>
        <section className="mt-10 border border-[#D4A017]/25 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold">Herramientas disponibles</h2>
          <ul className="mt-5 space-y-2 text-sm leading-6 text-[#23364D]">
            {tools.map((tool) => <li key={tool}>- {tool}</li>)}
          </ul>
        </section>
        <section className="mt-6 border border-[#D4A017]/25 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold">Reglas de seguridad</h2>
          <p className="mt-4 text-sm leading-7 text-[#23364D]">
            El conector no emite facturas definitivas, no envía documentos, no cobra, no borra registros y no modifica contabilidad. Cualquier acción de escritura queda limitada a crear borradores revisables.
          </p>
        </section>
      </div>
    </main>
  );
}
