'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, CircleDot, RefreshCw, Save, XCircle } from 'lucide-react';
import { FiscalTemplatePanel } from './FiscalTemplatePanel';

type Company = { id: string; name: string; nif: string | null };
type Obligation = {
  id: string; client_id: string | null; company_id: string; kind: string; model_code: string | null;
  title: string | null; period_key: string | null; due_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'; notes: string | null;
  task_id: string | null; google_event_id: string | null; source: string; created_at: string;
  updated_at: string; completed_at: string | null;
};
type OperationsPayload = { client: { id: string; name: string; email: string }; companies: Company[] };

function statusLabel(status: Obligation['status']) {
  if (status === 'planned') return 'Planificada';
  if (status === 'in_progress') return 'En curso';
  if (status === 'completed') return 'Completada';
  return 'Cancelada';
}

export default function ClientFiscalObligationsPage() {
  const { id } = useParams<{ id: string }>();
  const [context, setContext] = useState<OperationsPayload | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [kind, setKind] = useState('Declaración fiscal');
  const [modelCode, setModelCode] = useState('');
  const [title, setTitle] = useState('');
  const [periodKey, setPeriodKey] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [ctxRes, obligationsRes] = await Promise.all([
        fetch(`/api/admin/clientes/${id}/operations`, { cache: 'no-store' }),
        fetch(`/api/admin/clientes/${id}/obligations`, { cache: 'no-store' }),
      ]);
      const ctx = await ctxRes.json();
      const fiscal = await obligationsRes.json();
      if (!ctxRes.ok) throw new Error(ctx.error ?? 'No se pudo cargar el cliente');
      if (!obligationsRes.ok) throw new Error(fiscal.error ?? 'No se pudieron cargar las obligaciones');
      setContext(ctx); setObligations(fiscal.obligations ?? []);
      if (!companyId && ctx.companies?.length === 1) setCompanyId(ctx.companies[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally { setLoading(false); }
  }, [companyId, id]);

  useEffect(() => { void load(); }, [load]);

  const open = useMemo(() => obligations.filter((item) => item.status === 'planned' || item.status === 'in_progress'), [obligations]);
  const companyById = useMemo(() => new Map((context?.companies ?? []).map((company) => [company.id, company])), [context]);

  const create = async () => {
    if (!companyId || !title.trim() || !dueDate) { setError('Entidad, título y fecha de vencimiento son obligatorios.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/obligations`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyId, kind, modelCode: modelCode || null, title, periodKey: periodKey || null, dueDate, notes: notes || null, syncCalendar: true }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo crear la obligación');
      setModelCode(''); setTitle(''); setPeriodKey(''); setDueDate(''); setNotes(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const setStatus = async (obligationId: string, status: Obligation['status']) => {
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/obligations`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ obligationId, status, syncCalendar: true }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo actualizar la obligación');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-7 text-[#07111d]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Cliente 360 · Fiscal</p><h1 className="mt-1 font-serif text-3xl font-bold">Obligaciones y plazos</h1><p className="mt-1 text-sm text-[#52606d]">{context?.client ? `${context.client.name} · ${context.client.email}` : 'Gestión fiscal confirmada por Admin'}</p></div>
          <div className="flex gap-2"><Link href={`/admin/clientes/${id}/operaciones`} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold">Operaciones</Link><button onClick={() => void load()} type="button" className="rounded-xl border border-[#d8cbb5] bg-white p-2.5" title="Actualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">EXPERT no asigna modelos fiscales automáticamente por forma jurídica o plan. Tampoco los deduce por tipo de cliente. Primero confirma una plantilla para la entidad; después EXPERT genera los próximos vencimientos, tareas y eventos. Para casos especiales o fechas no estándar, conserva la creación manual de abajo.</div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {context && <FiscalTemplatePanel clientId={id} companies={context.companies} onGenerated={() => void load()} />}

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <h2 className="font-serif text-lg font-bold">Obligación manual / caso especial</h2>
          <p className="mt-1 text-xs text-[#52606d]">Úsala para obligaciones que no encajen en las plantillas o para fechas especiales confirmadas.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold">Entidad<select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm"><option value="">Seleccionar…</option>{(context?.companies ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}{company.nif ? ` · ${company.nif}` : ''}</option>)}</select></label>
            <label className="text-xs font-semibold">Tipo<input value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold">Modelo (opcional)<input value={modelCode} onChange={(e) => setModelCode(e.target.value)} placeholder="303, 111, 115…" className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold">Periodo (opcional)<input value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} placeholder="3T 2026" className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold md:col-span-2">Título<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="IVA trimestral" className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold">Vencimiento<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold md:col-span-2 xl:col-span-4">Notas<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm" placeholder="Criterio, documentación necesaria o particularidades…" /></label>
          </div>
          <button type="button" disabled={saving} onClick={() => void create()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />Guardar y crear seguimiento</button>
        </section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-lg font-bold">Seguimiento fiscal</h2><span className="text-xs text-[#6b7280]">{open.length} abiertas · {obligations.length} total</span></div>
          <div className="mt-4 space-y-3">
            {obligations.length === 0 ? <p className="text-sm text-[#6b7280]">Todavía no hay obligaciones fiscales confirmadas.</p> : obligations.map((item) => {
              const company = companyById.get(item.company_id);
              return <article key={item.id} className="rounded-xl border border-[#eee6d8] p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><CalendarClock className="h-4 w-4 text-[#c88b25]" /><h3 className="font-bold">{item.model_code ? `Modelo ${item.model_code} · ` : ''}{item.title || item.kind}</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold">{statusLabel(item.status)}</span></div><p className="mt-1 text-xs text-[#52606d]">{company?.name ?? 'Entidad'} · vence {new Date(`${item.due_date}T12:00:00`).toLocaleDateString('es-ES')}{item.period_key ? ` · ${item.period_key}` : ''}</p>{item.notes && <p className="mt-2 text-xs leading-5 text-[#6b7280]">{item.notes}</p>}<div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#8a9aab]"><span>{item.task_id ? 'Tarea Admin vinculada' : 'Tarea pendiente de sincronización'}</span><span>{item.google_event_id ? 'Calendario Admin sincronizado' : 'Sin evento Calendar'}</span><span>{item.source === 'system' ? 'Generada desde plantilla confirmada' : 'Alta manual'}</span></div></div><div className="flex flex-wrap gap-2">{item.status === 'planned' && <button disabled={saving} onClick={() => void setStatus(item.id, 'in_progress')} className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-[11px] font-bold"><CircleDot className="h-3.5 w-3.5" />En curso</button>}{(item.status === 'planned' || item.status === 'in_progress') && <button disabled={saving} onClick={() => void setStatus(item.id, 'completed')} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Completar</button>}{(item.status === 'planned' || item.status === 'in_progress') && <button disabled={saving} onClick={() => void setStatus(item.id, 'cancelled')} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700"><XCircle className="h-3.5 w-3.5" />Cancelar</button>}</div></div></article>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
