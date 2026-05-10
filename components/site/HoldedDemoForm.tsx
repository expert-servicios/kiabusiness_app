'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

export function HoldedDemoForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fields, setFields] = useState({ nombre: '', email: '', empresa: '', mensaje: '', hp_url: '' });

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.nombre || !fields.email || !fields.mensaje) return;
    setStatus('loading');
    try {
      const recaptcha_token = await getRecaptchaToken('contact');
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: fields.nombre,
          email: fields.email,
          asunto: 'Demo Holded',
          mensaje: `Empresa/Actividad: ${fields.empresa || '—'}\n\n${fields.mensaje}`,
          hp_url: fields.hp_url,
          recaptcha_token
        })
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center border border-[#D4A017]/25 bg-[#F8F6F1] p-10 text-center text-[#0D1B2A] shadow-[0_22px_60px_rgba(13,27,42,0.32)]">
        <CheckCircle className="h-12 w-12 text-[#D4A017]" />
        <h3 className="mt-4 font-serif text-2xl font-bold">Solicitud recibida</h3>
        <p className="mt-3 text-sm leading-6 text-[#23364D]">
          Te contactamos en menos de 24 horas hábiles para coordinar la revisión inicial.
        </p>
        <Link
          href="/holded"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
        >
          Ver todo sobre Holded <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-[#D4A017]/25 bg-[#F8F6F1] p-6 text-[#0D1B2A] shadow-[0_22px_60px_rgba(13,27,42,0.32)]"
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Solicitud de demostración</p>
      <h3 className="mt-3 font-serif text-3xl font-bold">Agenda una revisión inicial</h3>
      <p className="mt-3 text-sm leading-6 text-[#23364D]">
        Cuéntanos el punto de partida y prepararemos una propuesta de migración o formación en Holded.
      </p>
      <div className="mt-6 grid gap-3">
        <input
          type="text"
          name="hp_url"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={fields.hp_url}
          onChange={onChange}
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        />
        <input
          name="nombre"
          value={fields.nombre}
          onChange={onChange}
          required
          placeholder="Nombre"
          className="min-h-12 border border-[#D4A017]/25 bg-[#F8F6F1] px-4 text-sm outline-none transition focus:border-[#D4A017]"
        />
        <input
          name="email"
          type="email"
          value={fields.email}
          onChange={onChange}
          required
          placeholder="Email"
          className="min-h-12 border border-[#D4A017]/25 bg-[#F8F6F1] px-4 text-sm outline-none transition focus:border-[#D4A017]"
        />
        <input
          name="empresa"
          value={fields.empresa}
          onChange={onChange}
          placeholder="Empresa o actividad"
          className="min-h-12 border border-[#D4A017]/25 bg-[#F8F6F1] px-4 text-sm outline-none transition focus:border-[#D4A017]"
        />
        <textarea
          name="mensaje"
          value={fields.mensaje}
          onChange={onChange}
          required
          rows={4}
          placeholder="Qué sistema utilizas ahora y qué necesitas migrar"
          className="border border-[#D4A017]/25 bg-[#F8F6F1] px-4 py-3 text-sm outline-none transition focus:border-[#D4A017]"
        />
      </div>
      {status === 'error' && (
        <p className="mt-3 text-sm text-red-600">
          Error al enviar. Escríbenos a{' '}
          <a href="mailto:soy@kseniailicheva.com" className="underline">
            soy@kseniailicheva.com
          </a>
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
      >
        {status === 'loading' ? 'Enviando...' : 'Solicitar demostración'}
      </button>
    </form>
  );
}
