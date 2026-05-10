'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { Breadcrumb } from '@/components/site/Breadcrumb';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

const STEPS_INCLUDED = [
  { step: '01', title: 'Activamos tu demo', desc: 'En menos de 24 horas hábiles activamos tu prueba gratuita de Holded de 14 días.' },
  { step: '02', title: 'Onboarding de 1 hora', desc: 'Reservas una videollamada con nosotros para configurar Holded adaptado a tu negocio.' },
  { step: '03', title: 'Formación de 2 horas', desc: 'Sesión práctica para que aprendas a usarlo con autonomía desde el primer día.' }
];

export default function PlanGratuitoPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company_name: '',
    company_type: '', employees_count: '', current_software: '', needs: '', hp_url: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const recaptcha_token = await getRecaptchaToken('holded_demo');
      const res = await fetch('/api/holded-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptcha_token })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
      } else {
        setErrorMsg(data.error ?? 'Error al enviar. Inténtalo de nuevo.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-[#D4A017]" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold text-[#0D1B2A]">¡Solicitud recibida!</h1>
          <p className="mt-4 text-base leading-7 text-[#23364D]">
            Hemos recibido tu solicitud. En menos de <strong>24 horas hábiles</strong> activamos tu demo de Holded y te lo confirmamos por email.
          </p>
          <p className="mt-3 text-sm text-[#23364D]">Incluido sin coste: onboarding de 1 hora + formación de 2 horas.</p>
          <Link
            href="/planes"
            className="mt-8 inline-flex items-center gap-2 border border-[#0D1B2A]/20 px-6 py-3 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a planes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="mx-auto max-w-4xl px-6 pt-5 pb-2">
        <Breadcrumb items={[{ label: 'Planes', href: '/planes' }, { label: 'Plan Gratuito Holded' }]} />
      </div>
      {/* Hero */}
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4A017]/40 bg-[#D4A017]/10 px-4 py-1.5">
            <Gift className="h-4 w-4 text-[#D4A017]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Sin coste</span>
          </div>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-5xl">
            Plan Gratuito Holded
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#9CA3AF]">
            Prueba Holded durante 14 días. Nosotros activamos la demo, te ayudamos con el onboarding
            y te formamos. Todo sin coste.
          </p>
        </div>
      </section>

      {/* Qué incluye */}
      <section className="bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Qué incluye</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS_INCLUDED.map(({ step, title, desc }) => (
              <div key={step} className="border border-[#D4A017]/25 bg-[#F8F6F1] p-6">
                <span className="font-serif text-3xl font-bold text-[#D4A017]">{step}</span>
                <h3 className="mt-4 font-serif text-lg font-bold text-[#0D1B2A]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Solicitar plan gratuito</p>
            <h2 className="mt-4 font-serif text-3xl font-bold">Rellena el formulario</h2>
            <p className="mt-3 text-sm text-[#23364D]">
              Cuéntanos sobre tu empresa y nos ponemos en marcha. Sin tarjeta de crédito, sin compromiso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {/* Honeypot */}
            <input type="text" name="hp_url" value={form.hp_url} onChange={handleChange} className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Nombre *</label>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange} required minLength={2}
                  placeholder="Tu nombre completo"
                  className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Email *</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="tu@empresa.com"
                  className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Teléfono *</label>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange} required
                  placeholder="+34 600 000 000"
                  className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Empresa o nombre de actividad *</label>
                <input
                  type="text" name="company_name" value={form.company_name} onChange={handleChange} required minLength={2}
                  placeholder="Mi Empresa SL / Juan Pérez (autónomo)"
                  className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Tipo de empresa</label>
                <select
                  name="company_type" value={form.company_type} onChange={handleChange}
                  className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] focus:border-[#D4A017] focus:outline-none"
                >
                  <option value="">Selecciona...</option>
                  <option>Autónomo / Freelance</option>
                  <option>Sociedad Limitada (SL)</option>
                  <option>Sociedad Anónima (SA)</option>
                  <option>Asociación / Fundación</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Número de empleados</label>
                <select
                  name="employees_count" value={form.employees_count} onChange={handleChange}
                  className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] focus:border-[#D4A017] focus:outline-none"
                >
                  <option value="">Selecciona...</option>
                  <option>Solo yo</option>
                  <option>2 – 5</option>
                  <option>6 – 15</option>
                  <option>16 – 50</option>
                  <option>Más de 50</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Software de contabilidad actual</label>
              <select
                name="current_software" value={form.current_software} onChange={handleChange}
                className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] focus:border-[#D4A017] focus:outline-none"
              >
                <option value="">Selecciona...</option>
                <option>Ninguno (lo lleva mi gestoría)</option>
                <option>Excel / hojas de cálculo</option>
                <option>Contaplus / SAGE</option>
                <option>A3 / Wolters Kluwer</option>
                <option>Holded (versión anterior)</option>
                <option>Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">¿Qué quieres gestionar con Holded?</label>
              <textarea
                name="needs" value={form.needs} onChange={handleChange} rows={4}
                placeholder="Facturas, contabilidad, nóminas, inventario... cuéntanos qué necesitas."
                className="mt-2 w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm font-semibold text-red-600">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex w-full items-center justify-center gap-2 bg-[#D4A017] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
            >
              {status === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                'Solicitar plan gratuito'
              )}
            </button>

            <p className="text-center text-xs text-[#9CA3AF]">
              Sin tarjeta de crédito. Sin permanencia. Solo para empresas radicadas en España.
            </p>
          </form>
        </div>
      </section>

    </main>
  );
}
