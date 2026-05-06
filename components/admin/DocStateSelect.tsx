'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock } from 'lucide-react';

const STATES = [
  { value: 'pendiente', label: 'Pendiente', icon: Clock, color: 'text-[#c88b25] bg-[#d7a33a]/10' },
  { value: 'revisado', label: 'Revisado', icon: Check, color: 'text-[#1fae4b] bg-[#1fae4b]/10' },
  { value: 'rechazado', label: 'Rechazado', icon: X, color: 'text-red-600 bg-red-50' }
] as const;

type DocState = (typeof STATES)[number]['value'];

export function DocStateSelect({ docId, currentState }: { docId: string; currentState: DocState }) {
  const router = useRouter();
  const [state, setState] = useState<DocState>(currentState);
  const [saving, setSaving] = useState(false);

  const current = STATES.find((s) => s.value === state) ?? STATES[0];
  const Icon = current.icon;

  const handleChange = async (next: DocState) => {
    if (next === state) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: next })
      });
      if (res.ok) {
        setState(next);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${current.color}`}>
        <Icon className="h-3 w-3" />
        {current.label}
      </span>
      <select
        value={state}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as DocState)}
        className="rounded-lg border border-[#d8cbb5] bg-white px-2 py-1 text-xs text-[#07111d] outline-none focus:border-[#d7a33a] disabled:opacity-50"
      >
        {STATES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
