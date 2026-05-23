import Link from 'next/link';
import { KpiCard } from './KpiCard';
import type { CommunicationMetrics } from '@/lib/admin/metrics/communication-metrics';

export function CommunicationSummary({ data }: { data: CommunicationMetrics }) {
  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Comunicación</p>
        <Link href="/admin/whatsapp" className="text-xs text-[#29384a] hover:text-[#07111d] underline underline-offset-2">
          Ver WhatsApp →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard label="WA sin responder" value={data.waSinResponder} alert={data.waSinResponder > 0} />
        <KpiCard label="Email sin responder" value={data.emailSinResponder} warn={data.emailSinResponder > 0} />
        <KpiCard label="Total sin responder" value={data.totalSinResponder} alert={data.totalSinResponder > 3} />
        <KpiCard label="Conversaciones hoy" value={data.conversacionesHoy} />
        <KpiCard label="Docs recibidos WA (7d)" value={data.docsRecibidosWa7d} />
      </div>
    </section>
  );
}
