'use client';

import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'new',       label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Cualificado' },
  { value: 'rejected',  label: 'Descartado' }
];

const COLOR: Record<string, string> = {
  new:       'bg-amber-100 border-amber-300 text-amber-800',
  contacted: 'bg-blue-100 border-blue-300 text-blue-800',
  qualified: 'bg-green-100 border-green-300 text-green-800',
  rejected:  'bg-gray-100 border-gray-300 text-gray-600'
};

export function LeadStatusSelect({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/saas-leads?id=${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setStatus(newStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none ${COLOR[status] ?? COLOR.new} ${loading ? 'opacity-50' : ''}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
