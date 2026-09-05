'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Mail, Bell, PanelRightOpen, PanelRightClose, Loader2, Maximize2, Minimize2, ListTodo } from 'lucide-react';
import { CorreoInbox } from './CorreoInbox';

type PanelTab = 'correo' | 'notificaciones';

type CorreoData = {
  ms365Connected: boolean;
  ms365Email: string | null;
  gmailConnected: boolean;
  gmailEmail: string | null;
  gmailSA: boolean;
  initialMails: Parameters<typeof CorreoInbox>[0]['initialMails'];
  initialProvider: 'ms365' | 'gmail';
};

const CORREO_FALLBACK: CorreoData = {
  ms365Connected: false, ms365Email: null,
  gmailConnected: false, gmailEmail: null,
  gmailSA: false, initialMails: [], initialProvider: 'ms365',
};

function CorreoTab() {
  const [data, setData] = useState<CorreoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const statusRes = await fetch('/api/admin/correo?action=status');
        if (!statusRes.ok) { setData(CORREO_FALLBACK); return; }
        const status = await statusRes.json();
        const ms365Connected: boolean = status.ms365Connected ?? false;
        const gmailConnected: boolean = status.gmailConnected ?? false;
        const initialProvider: 'ms365' | 'gmail' = gmailConnected ? 'gmail' : 'ms365';
        let initialMails: Parameters<typeof CorreoInbox>[0]['initialMails'] = [];
        if (ms365Connected || gmailConnected) {
          const mailsRes = await fetch(`/api/admin/correo?action=list&provider=${initialProvider}`);
          if (mailsRes.ok) {
            const d = await mailsRes.json();
            initialMails = d.mails ?? [];
          }
        }
        setData({
          ms365Connected,
          ms365Email: status.ms365Email ?? null,
          gmailConnected,
          gmailEmail: status.gmailEmail ?? null,
          gmailSA: status.gmailSA ?? false,
          initialMails,
          initialProvider,
        });
      } catch {
        setData(CORREO_FALLBACK);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PanelLoader />;
  if (!data) return null;
  return (
    <CorreoInbox
      ms365Connected={data.ms365Connected}
      ms365Email={data.ms365Email}
      gmailConnected={data.gmailConnected}
      gmailEmail={data.gmailEmail}
      gmailSA={data.gmailSA}
      initialMails={data.initialMails as Parameters<typeof CorreoInbox>[0]['initialMails']}
      initialProvider={data.initialProvider}
      errorParam={null}
      connectedParam={null}
    />
  );
}

type AlertTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  client_id: string | null;
  client: { id: string; full_name: string | null } | null;
  case: { id: string; service: string } | null;
};

function NotificacionesTab() {
  const [tasks, setTasks] = useState<AlertTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/tasks', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setTasks((json.tasks ?? []).filter((task: AlertTask) => task.status === 'pendiente' || task.status === 'en_progreso'));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <PanelLoader />;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-white/70">Tareas abiertas</p>
          <p className="text-[10px] text-white/35">EXPERT · KIA · manual</p>
        </div>
        <span className="rounded-full bg-[#D4A017]/15 px-2 py-1 text-[10px] font-bold text-[#D4A017]">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Bell className="h-10 w-10 text-white/20" />
            <p className="text-sm font-semibold text-white/50">Sin tareas abiertas</p>
            <p className="text-xs text-white/30">Los seguimientos automáticos aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 12).map((task) => {
              const overdue = Boolean(task.due_date && task.due_date < today);
              return (
                <div key={task.id} className={`rounded-xl border p-3 ${overdue ? 'border-red-400/30 bg-red-500/8' : 'border-white/8 bg-white/4'}`}>
                  <div className="flex items-start gap-2">
                    <ListTodo className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${overdue ? 'text-red-300' : 'text-[#D4A017]'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/80">{task.title}</p>
                      {task.description && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/40">{task.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/35">
                        {task.due_date && <span className={overdue ? 'font-bold text-red-300' : ''}>{overdue ? 'Vencida' : 'Vence'} {new Date(`${task.due_date}T12:00:00`).toLocaleDateString('es-ES')}</span>}
                        {task.client && <Link href={`/admin/clientes/${task.client.id}`} className="font-semibold text-[#D4A017] hover:underline">{task.client.full_name ?? 'Cliente'}</Link>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="border-t border-white/8 p-3">
        <Link href="/admin/tareas" className="flex w-full items-center justify-center rounded-lg bg-[#D4A017]/15 px-3 py-2 text-xs font-bold text-[#D4A017] hover:bg-[#D4A017]/20">Abrir lista completa de tareas</Link>
      </div>
    </div>
  );
}

function PanelLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/30" />
    </div>
  );
}

const TABS: { id: PanelTab; label: string; icon: React.ElementType }[] = [
  { id: 'correo', label: 'Correo', icon: Mail },
  { id: 'notificaciones', label: 'Avisos', icon: Bell },
];

export function AdminRightPanel({ emailUnreadCount = 0 }: { emailUnreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [tab, setTab] = useState<PanelTab>('correo');
  const [mounted, setMounted] = useState<Set<PanelTab>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('adminRightPanel');
    if (saved === 'open') setOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
    if (localStorage.getItem('adminRightPanelWide') === 'true') setWide(true);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem('adminRightPanel', next ? 'open' : 'closed');
      return next;
    });
  }, []);

  const toggleWide = useCallback(() => {
    setWide((prev) => {
      const next = !prev;
      localStorage.setItem('adminRightPanelWide', String(next));
      return next;
    });
  }, []);

  const handleTabChange = (t: PanelTab) => {
    setTab(t);
    setMounted((prev) => new Set([...prev, t]));
  };

  useEffect(() => {
    if (open) setMounted((prev) => new Set([...prev, tab])); // eslint-disable-line react-hooks/set-state-in-effect
  }, [open, tab]);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        title={open ? 'Cerrar inbox' : 'Abrir inbox'}
        className="hidden lg:flex fixed right-0 z-30 flex-col items-center gap-1 rounded-l-xl border border-r-0 border-white/10 bg-[#07111d] px-2 py-3 text-white/40 shadow-lg transition hover:text-white/80 top-1/2 -translate-y-1/2"
      >
        {open ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        {!open && emailUnreadCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">{emailUnreadCount > 99 ? '99+' : emailUnreadCount}</span>
        )}
      </button>

      <aside className={`hidden lg:flex flex-col shrink-0 border-l border-white/8 bg-[#07111d] sticky top-0 h-screen overflow-hidden transition-[width] duration-300 ease-in-out ${open ? (wide ? 'w-[50vw]' : 'w-[420px]') : 'w-0'}`}>
        {open && (
          <>
            <div className="flex items-center border-b border-white/8 px-1 py-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => handleTabChange(id)} className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === id ? 'bg-[#D4A017]/15 text-[#D4A017]' : 'text-white/40 hover:text-white/70'}`}>
                  <Icon className="h-3.5 w-3.5" />{label}
                  {id === 'correo' && emailUnreadCount > 0 && <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-500 px-0.5 text-[8px] font-bold text-white">{emailUnreadCount > 99 ? '99+' : emailUnreadCount}</span>}
                </button>
              ))}
              <button type="button" onClick={toggleWide} title={wide ? 'Reducir panel' : 'Ampliar panel'} className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/70">
                {wide ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden">
              {TABS.map(({ id }) => (
                <div key={id} className={`absolute inset-0 overflow-auto ${tab === id ? 'z-10 visible' : 'z-0 invisible'}`}>
                  {mounted.has(id) && (id === 'correo' ? <CorreoTab /> : <NotificacionesTab />)}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
