'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Phone, Mail, User, MessageSquare, ChevronDown } from 'lucide-react';
import { getRecaptchaSiteKey, getRecaptchaToken } from '@/lib/utils/recaptcha-client';

const SERVICES = [
  'Consulta fiscal (IRPF, IVA, IS…)',
  'Extranjería y residencia',
  'Constitución de sociedad / autónomo',
  'Gestión contable y administrativa',
  'Gestión de Holded (ERP)',
  'Suscripción mensual de asesoría',
  'Otro / Sin definir'
];

const TIME_SLOTS = [
  'Mañana (9h–13h)',
  'Tarde (15h–19h)',
  'Indiferente'
];

const inputCls = 'mt-1.5 w-full border border-[#D4A017]/25 bg-white px-4 py-3 text-sm text-[#0D1B2A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/10';
const labelCls = 'block text-sm font-semibold text-[#0D1B2A]';

// Minimum booking date: tomorrow
function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// Maximum: 60 days ahead
function getMaxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split('T')[0];
}

export function CitaForm() {
  const router = useRouter();
  const recaptchaEnabled = Boolean(getRecaptchaSiteKey());
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    preferred_date: '',
    preferred_time: TIME_SLOTS[0],
    notes: '',
    hp_url: ''
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.hp_url) { router.push('/gracias/cita'); return; }
    setStatus('loading');
    setErrorMsg('');
    try {
      const recaptcha_token = recaptchaEnabled ? await getRecaptchaToken('booking') : '';
      const res = await fetch('/api/cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptcha_token })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error al enviar la solicitud. Inténtalo de nuevo.');
        setStatus('error');
        return;
      }
      router.push('/gracias/cita');
    } catch {
      setErrorMsg('Error de conexión. Comprueba tu internet e inténtalo de nuevo.');
      setStatus('error');
    } finally {
      if (status !== 'error') setStatus('idle');
    }
  };

  const loading = status === 'loading';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot */}
      <input
        type="text"
        name="hp_url"
        value={form.hp_url}
        onChange={(e) => set('hp_url', e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Nombre + Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#D4A017]" /> Nombre completo *</span>
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Tu nombre"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#D4A017]" /> Email *</span>
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="tu@email.com"
            className={inputCls}
          />
        </div>
      </div>

      {/* Teléfono */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#D4A017]" /> Teléfono</span>
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+34 600 000 000"
          className={inputCls}
        />
      </div>

      {/* Servicio */}
      <div>
        <label className={labelCls}>Motivo de la consulta *</label>
        <div className="relative mt-1.5">
          <select
            required
            value={form.service}
            onChange={(e) => set('service', e.target.value)}
            className={`${inputCls} mt-0 appearance-none pr-10`}
          >
            <option value="">Selecciona el motivo…</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4A017]" />
        </div>
      </div>

      {/* Fecha + Franja */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#D4A017]" /> Fecha preferida *</span>
          </label>
          <input
            required
            type="date"
            value={form.preferred_date}
            onChange={(e) => set('preferred_date', e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#D4A017]" /> Franja horaria *</span>
          </label>
          <div className="relative mt-1.5">
            <select
              required
              value={form.preferred_time}
              onChange={(e) => set('preferred_time', e.target.value)}
              className={`${inputCls} mt-0 appearance-none pr-10`}
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4A017]" />
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-[#D4A017]" /> Cuéntanos brevemente tu caso</span>
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Describe en pocas palabras tu situación para que podamos preparar la consulta…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {errorMsg && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 bg-[#D4A017] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
      >
        {loading ? 'Enviando…' : 'Solicitar cita'}
      </button>

      <p className="text-center text-xs text-[#6B7280]">
        Te confirmaremos la cita en menos de 24 horas hábiles por email.
        La consulta inicial es <strong>gratuita</strong>.
      </p>
    </form>
  );
}
