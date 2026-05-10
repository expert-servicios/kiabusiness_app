'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

interface Props {
  source?: string;
  variant?: 'dark' | 'light';
  layout?: 'horizontal' | 'vertical';
}

export function NewsletterForm({ source = 'website', variant = 'dark', layout = 'horizontal' }: Props) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isDark = variant === 'dark';
  const isHorizontal = layout === 'horizontal';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const recaptcha_token = await getRecaptchaToken('newsletter');
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, hp_url: hp, recaptcha_token })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error al suscribirse.');
        setStatus('error');
      } else {
        setStatus('ok');
        setEmail('');
      }
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return (
      <div className={`flex items-center gap-3 rounded-none border px-5 py-4 ${isDark ? 'border-[#D4A017]/40 bg-[#D4A017]/10 text-[#F8F6F1]' : 'border-[#D4A017]/40 bg-[#D4A017]/10 text-[#0D1B2A]'}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#D4A017]">
          <Check className="h-4 w-4 text-[#0D1B2A]" />
        </span>
        <div>
          <p className="text-sm font-bold">¡Suscripción confirmada!</p>
          <p className={`text-xs ${isDark ? 'text-[#9CA3AF]' : 'text-[#23364D]'}`}>
            Te avisaremos de nuevos artículos y alertas fiscales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={isHorizontal ? 'flex flex-col gap-3 sm:flex-row sm:items-end' : 'flex flex-col gap-3'}
    >
      {/* Honeypot — oculto para usuarios, visible para bots */}
      <input
        type="text"
        name="hp_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      />

      <div className={isHorizontal ? 'flex-1' : ''}>
        <label className={`mb-1.5 block text-xs font-bold uppercase tracking-widest ${isDark ? 'text-[#9CA3AF]' : 'text-[#23364D]'}`}>
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className={`min-h-11 w-full border px-4 text-sm outline-none transition focus:border-[#D4A017] ${isDark ? 'border-[#D4A017]/30 bg-[#23364D]/40 text-[#F8F6F1] placeholder:text-[#9CA3AF]' : 'border-[#D4A017]/30 bg-white text-[#0D1B2A] placeholder:text-[#9CA3AF]'}`}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60 sm:shrink-0"
      >
        {status === 'loading' ? 'Enviando…' : 'Suscribirme'}
        {status !== 'loading' && <ArrowRight className="h-4 w-4" />}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-400 sm:col-span-2">{errorMsg}</p>
      )}
    </form>
  );
}
