'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, ListTodo, Loader2, Plus, RefreshCw } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  case_id: string | null;
  client_id: string | null;
  due_date: string | null;
  source: 'manual' | 'kia' | 'system';
  created_at: string;
  completed_at: string | null;
  client: { id: string; full_name: string | null } | null;
  case: { id: string; service: string; state: string; status: string } | null;
};

type TaskFilter = 'open' | 'all' | Task['status'];
const priorityLabel = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' } as const;
const FILTERS: Array<{ value: TaskFilter; label: string }> = [
  { value: 'open', label: 'Abiertas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completadas' },
  { value: 'all', label: 'Todas' },
];

export default function AdminTasksPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('open');
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('media');
  const [dueDate, setDueDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (clientId) params.set('clientId', clientId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/tasks${qs}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudieron cargar las tareas');
      setTasks(json.tasks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'open') return task.status === 'pendiente' || task.status === 'en_progreso';
    return task.status === filter;
  }), [tasks, filter]);

  async function setStatus(id: string, status: Task['status']) {
    setSaving(id); setError('');
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo actualizar');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar'); }
    finally { setSaving(''); }
  }

  async function createTask(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving('new'); setError('');
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, priority, dueDate: dueDate || null, clientId: clientId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo crear la tarea');
      setTitle(''); setDescription(''); setPriority('media'); setDueDate(''); setShowNew(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo crear la tarea'); }
    finally { setSaving(''); }
  }

  const today = new Date().toISOString().slice(0, 10);
  const openCount = tasks.filter((t) => t.status === 'pendiente' || t.status === 'en_progreso').length;
  const overdueCount = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'completada' && t.status !== 'cancelada').length;
  const contextualName = clientId ? tasks.find((task) => task.client)?.client?.full_name : null;

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Admin · Operaciones</p>
            <h1 className="mt-1 font-serif text-3xl font-bold">Tareas pendientes</h1>
            <p className="mt-2 text-sm text-[#52606d]">{clientId ? `Vista contextual del cliente${contextualName ? ` · ${contextualName}` : ''}.` : 'Seguimiento operativo generado por EXPERT, KIA o manualmente.'}</p>
            {clientId && <Link href={`/admin/clientes/${clientId}/operaciones`} className="mt-2 inline-block text-xs font-bold text-[#c88b25]">← Volver a Operaciones 360º</Link>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} className="rounded-xl border border-[#d8cbb5] bg-white p-2.5" title="Actualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button type="button" onClick={() => setShowNew((v) => !v)} className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Nueva tarea</button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4"><p className="text-xs text-[#6b7280]">Abiertas</p><p className="mt-1 font-serif text-3xl font-bold">{openCount}</p></div>
          <div className={`rounded-2xl border p-4 ${overdueCount ? 'border-red-200 bg-red-50' : 'border-[#d8cbb5] bg-white'}`}><p className="text-xs text-[#6b7280]">Vencidas</p><p className="mt-1 font-serif text-3xl font-bold">{overdueCount}</p></div>
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4"><p className="text-xs text-[#6b7280]">Total</p><p className="mt-1 font-serif text-3xl font-bold">{tasks.length}</p></div>
        </div>

        {showNew && <form onSubmit={createTask} className="mt-5 rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg font-bold">Nueva tarea manual</h2>
          {clientId && <p className="mt-1 text-xs text-[#52606d]">La tarea quedará vinculada a este cliente.</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="rounded-xl border border-[#d8cbb5] px-3 py-2.5 text-sm" required />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl border border-[#d8cbb5] px-3 py-2.5 text-sm" />
            <select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} className="rounded-xl border border-[#d8cbb5] px-3 py-2.5 text-sm"><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option></select>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" className="rounded-xl border border-[#d8cbb5] px-3 py-2.5 text-sm" />
          </div>
          <div className="mt-4 flex justify-end"><button disabled={saving === 'new'} className="rounded-xl bg-[#d7a33a] px-4 py-2 text-sm font-bold">{saving === 'new' ? 'Guardando…' : 'Crear tarea'}</button></div>
        </form>}

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map(({ value, label }) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === value ? 'bg-[#07111d] text-white' : 'border border-[#d8cbb5] bg-white text-[#52606d]'}`}>{label}</button>)}
        </div>

        <div className="mt-4 space-y-3">
          {loading && !tasks.length ? <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" /></div> : visible.length === 0 ? <div className="rounded-2xl border border-[#d8cbb5] bg-white p-10 text-center text-sm text-[#6b7280]">No hay tareas en este filtro.</div> : visible.map((task) => {
            const overdue = Boolean(task.due_date && task.due_date < today && task.status !== 'completada' && task.status !== 'cancelada');
            return <div key={task.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${overdue ? 'border-red-200' : 'border-[#d8cbb5]'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><ListTodo className="h-4 w-4 text-[#c88b25]" /><h2 className="font-semibold">{task.title}</h2><span className="rounded-full bg-[#f8f4eb] px-2 py-0.5 text-[10px] font-bold uppercase">{task.source}</span><span className="rounded-full bg-[#f8f4eb] px-2 py-0.5 text-[10px] font-bold">{priorityLabel[task.priority]}</span></div>
                  {task.description && <p className="mt-2 text-sm leading-6 text-[#52606d]">{task.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6b7280]">
                    {task.due_date && <span className={overdue ? 'font-bold text-red-700' : ''}>Vence: {new Date(`${task.due_date}T12:00:00`).toLocaleDateString('es-ES')}</span>}
                    {task.client && <Link href={`/admin/clientes/${task.client.id}`} className="font-bold text-[#9a6a17]">Cliente: {task.client.full_name ?? task.client.id.slice(0, 8)}</Link>}
                    {task.case && <Link href={`/admin/expedientes?caseId=${task.case.id}`} className="font-bold text-[#9a6a17]">Expediente: {task.case.service}</Link>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {task.status === 'pendiente' && <button type="button" disabled={saving === task.id} onClick={() => void setStatus(task.id, 'en_progreso')} className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold"><CircleDashed className="h-3.5 w-3.5" />Iniciar</button>}
                  {(task.status === 'pendiente' || task.status === 'en_progreso') && <button type="button" disabled={saving === task.id} onClick={() => void setStatus(task.id, 'completada')} className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5" />Completar</button>}
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>
    </main>
  );
}
