'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Minus, Calendar, Loader2, AlertTriangle, Link2, Link2Off } from 'lucide-react';
import { urgencyLevel } from '@/lib/utils/fiscal-calendar';

interface FiscalObligation {
  id: string;
  modelo: string;
  description: string;
  period_label: string | null;
  deadline: string;
  status: 'pending' | 'submitted' | 'exempt' | 'skipped';
  google_event_id: string | null;
  notes: string | null;
}

interface Props {
  obligations: FiscalObligation[];
  googleConnected: boolean;
  flashConnected?: boolean;
  flashError?: boolean;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  Icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  submitted: { label: 'Presentada', Icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  exempt:    { label: 'Exenta',     Icon: Minus,         color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  skipped:   { label: 'Omitida',    Icon: Minus,         color: 'text-gray-400',   bg: 'bg-gray-50 border-gray-200' },
} as const;

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
}

function ObligationCard({ obl }: { obl: FiscalObligation }) {
  const urgency = obl.status === 'pending' ? urgencyLevel(obl.deadline) : 'ok';
  const cfg = STATUS_CONFIG[obl.status];
  const { Icon } = cfg;
  const isOverdue = urgency === 'overdue' && obl.status === 'pending';

  const leftBorder = {
    overdue: 'border-l-4 border-l-red-500',
    critical: 'border-l-4 border-l-amber-500',
    soon: 'border-l-4 border-l-yellow-400',
    ok: '',
  }[urgency];

  return (
    <div className={`rounded-2xl border border-[#d8cbb5] bg-white p-4 shadow-sm ${leftBorder}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-lg bg-[#07111d]/8 px-2 py-0.5 font-mono text-xs font-bold text-[#07111d]">
              M-{obl.modelo}
            </span>
            {obl.period_label && (
              <span className="text-xs text-[#29384a]">{obl.period_label}</span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-[#07111d]">{obl.description}</p>
          <p className={`mt-1 text-xs font-medium ${isOverdue ? 'text-red-600' : urgency === 'critical' ? 'text-amber-700' : 'text-[#29384a]'}`}>
            Plazo: {formatDate(obl.deadline)}
            {isOverdue && ' — VENCIDA'}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${isOverdue ? 'text-red-600 bg-red-50 border-red-200' : cfg.color}`}>
          <Icon className="h-3 w-3" />
          {isOverdue ? 'Vencida' : cfg.label}
        </span>
      </div>
      {obl.google_event_id && (
        <p className="mt-2 flex items-center gap-1 text-[10px] text-green-600">
          <Calendar className="h-3 w-3" /> Añadido a Google Calendar
        </p>
      )}
    </div>
  );
}

export function ClientFiscalCalendar({ obligations, googleConnected: initialConnected, flashConnected, flashError }: Props) {
  const [connected, setConnected] = useState(initialConnected || flashConnected);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);

  const grouped: Record<string, FiscalObligation[]> = {};
  for (const obl of obligations) {
    const month = obl.deadline.slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(obl);
  }

  async function syncCalendar() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/fiscal-calendar/sync-google', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(data.error ?? 'Error'); return; }
      setSyncMsg(`✓ ${data.synced} eventos sincronizados en Google Calendar`);
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await fetch('/api/fiscal-calendar/sync-google', { method: 'DELETE' });
      setConnected(false);
      setSyncMsg('Google Calendar desconectado');
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Flash messages */}
      {flashConnected && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Google Calendar conectado correctamente.
        </div>
      )}
      {flashError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          No se pudo conectar Google Calendar. Inténtalo de nuevo.
        </div>
      )}

      {/* Google Calendar connection card */}
      <div className={`rounded-2xl border p-5 shadow-sm ${connected ? 'border-green-200 bg-green-50' : 'border-[#d8cbb5] bg-white'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#07111d]">
              {connected ? '✓ Google Calendar conectado' : 'Conecta Google Calendar'}
            </p>
            <p className="mt-0.5 text-sm text-[#29384a]">
              {connected
                ? 'Sincroniza tus obligaciones fiscales y recibe recordatorios por email.'
                : 'Añade automáticamente tus plazos fiscales a tu Google Calendar con recordatorios.'}
            </p>
            {syncMsg && <p className="mt-1 text-xs text-[#29384a]">{syncMsg}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {connected ? (
              <>
                <button
                  onClick={syncCalendar}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2d42] disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                  Sincronizar
                </button>
                <button
                  onClick={disconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-medium text-[#29384a] transition hover:bg-[#f0e9d8] disabled:opacity-50"
                >
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
                  Desconectar
                </button>
              </>
            ) : (
              <a
                href="/api/auth/google-calendar"
                className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2d42]"
              >
                <Link2 className="h-4 w-4" /> Conectar Google Calendar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Obligations list */}
      {obligations.length === 0 ? (
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-[#d8cbb5]" />
          <p className="font-semibold text-[#07111d]">Sin obligaciones asignadas</p>
          <p className="mt-1 text-sm text-[#29384a]">Tu asesor generará tu calendario fiscal personalizado.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, obls]) => {
              const dt = new Date(month + '-01T12:00:00');
              const label = dt.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
              return (
                <div key={month}>
                  <h2 className="mb-3 font-serif text-base font-bold capitalize text-[#07111d]">{label}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {obls.map((obl) => <ObligationCard key={obl.id} obl={obl} />)}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
