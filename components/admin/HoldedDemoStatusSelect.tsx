'use client';

import { useState } from 'react';

const STATUSES = [
  { value: 'pending',        label: 'Pendiente de activar',    color: 'text-amber-700  bg-amber-50  border-amber-200' },
  { value: 'demo_active',    label: 'Demo activa',             color: 'text-blue-700   bg-blue-50   border-blue-200' },
  { value: 'onboarding_done',label: 'Onboarding hecho',        color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { value: 'training_done',  label: 'Formación hecha',         color: 'text-green-700  bg-green-50  border-green-200' },
  { value: 'converted',      label: 'Convertido a cliente',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'closed',         label: 'Cerrado',                 color: 'text-gray-500   bg-gray-50   border-gray-200' }
] as const;

type Status = typeof STATUSES[number]['value'];

export function HoldedDemoStatusSelect({ demoId, initialStatus }: { demoId: string; initialStatus: string }) {
  const [status, setStatus] = useState<Status>(initialStatus as Status);
  const [loading, setLoading] = useState(false);

  const current = STATUSES.find((s) => s.value === status) ?? STATUSES[0];

  async function handleChange(newStatus: Status) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/holded-demos?id=${demoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) setStatus(newStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value as Status)}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${current.color} ${loading ? 'opacity-50' : ''}`}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
