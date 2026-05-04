'use client';

import { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

interface Props {
  initialFullName: string;
  initialPhone: string;
  email: string;
}

export function ProfileForm({ initialFullName, initialPhone, email }: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone })
      });
      const data = await response.json();
      if (!response.ok) { setMessage({ text: data.error ?? 'Error al guardar', ok: false }); return; }
      setMessage({ text: 'Perfil actualizado correctamente.', ok: true });
    } catch {
      setMessage({ text: 'Error de conexión.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Email</label>
        <input type="email" value={email} disabled
          className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm text-[#29384a] cursor-not-allowed" />
        <p className="mt-1 text-xs text-[#29384a]">El email no se puede modificar desde aquí.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Nombre completo</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
          placeholder="Tu nombre y apellidos"
          className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]" />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Teléfono</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="+34 6XX XXX XXX"
          className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]" />
      </div>

      <div className="flex items-center gap-4">
        <button type="button" onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-60">
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {message ? (
          <p className={`flex items-center gap-1 text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
            {message.ok ? <CheckCircle2 className="h-4 w-4" /> : null}
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
