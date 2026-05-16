'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Calendar, X } from 'lucide-react';

interface Notification {
  id: string;
  modelo: string;
  description: string;
  deadline: string;
  period_label: string | null;
  urgency: 'overdue' | 'critical' | 'soon' | 'ok';
}

const URGENCY_STYLES = {
  overdue:  { dot: 'bg-red-500',    text: 'text-red-600',    label: 'Vencida' },
  critical: { dot: 'bg-amber-500',  text: 'text-amber-600',  label: 'Mañana' },
  soon:     { dot: 'bg-yellow-400', text: 'text-yellow-600', label: 'Próxima' },
  ok:       { dot: 'bg-gray-300',   text: 'text-gray-500',   label: '' },
};

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]}`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications ?? []); setCount(d.count ?? 0); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/8 hover:text-white"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-[#d8cbb5] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#f0e9d8] px-4 py-3">
            <p className="text-sm font-bold text-[#07111d]">Obligaciones fiscales</p>
            <button onClick={() => setOpen(false)} className="text-[#29384a] hover:text-[#07111d]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-[#d8cbb5]" />
              <p className="text-sm font-semibold text-[#07111d]">Sin plazos próximos</p>
              <p className="mt-0.5 text-xs text-[#29384a]">Todo al día en los próximos 30 días.</p>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-[#f0e9d8] overflow-y-auto">
              {notifications.map((n) => {
                const styles = URGENCY_STYLES[n.urgency];
                return (
                  <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#faf8f2]">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#07111d]">{n.description}</p>
                      <p className="mt-0.5 text-[10px] text-[#29384a]">
                        M-{n.modelo}{n.period_label ? ` · ${n.period_label}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold ${styles.text}`}>
                      {fmtDate(n.deadline)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-[#f0e9d8] px-4 py-2.5">
            <Link
              href="/dashboard/calendario-fiscal"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[#c88b25] hover:underline"
            >
              Ver calendario completo →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
