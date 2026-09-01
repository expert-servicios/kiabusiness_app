'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';
import { trackAcademyEvent } from '@/lib/utils/analytics';

export function AcademyLeadForm({
  programSlug,
  programName,
  hasOfficialCertification = true,
}: {
  programSlug: string;
  programName: string;
  /** Set to false for programs with no official-certification add-on (e.g. Gestión Laboral Integral) to hide that checkbox. */
  hasOfficialCertification?: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [experience, setExperience] = useState('');
  const [language, setLanguage] = useState<'es' | 'ru'>('es');
  const [certificationInterest, setCertificationInterest] = useState(false);
  const [hp, setHp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const recaptcha_token = await getRecaptchaToken('academy_lead');
      const res = await fetch('/api/academy/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programSlug,
          name,
          email,
          phone,
          currentRole,
          experience,
          language,
          certificationInterest: hasOfficialCertification ? certificationInterest : false,
          hp_url: hp,
          recaptcha_token,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        trackAcademyEvent('course_lead_submit', { program_slug: programSlug, locale: language });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center border border-[#D4A017]/25 bg-[#F8F6F1] px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center bg-[#D4A017]/15">
          <Check className="h-7 w-7 text-[#D4A017]" />
        </div>
        <h3 className="mt-5 font-serif text-2xl font-bold text-[#0D1B2A]">¡Solicitud recibida!</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#23364D]">
          Revisaremos tu perfil y te contactaremos en un plazo de 24 horas hábiles con toda la información sobre
          modalidad, calendario y requisitos de {programName}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 border border-[#D4A017]/25 bg-white p-6 shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#23364D]">
            Nombre completo <span className="text-[#D4A017]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Tu nombre"
            aria-label="Nombre completo"
            className="w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#23364D]">
            Email <span className="text-[#D4A017]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
            aria-label="Email"
            className="w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#23364D]">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            aria-label="Teléfono"
            className="w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#23364D]">Puesto actual</label>
          <input
            type="text"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            placeholder="Ej. Administrativo, autónomo..."
            aria-label="Puesto actual"
            className="w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#23364D]">
          Cuéntanos tu experiencia y tus objetivos
        </label>
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={3}
          placeholder="Experiencia profesional, motivo de interés en el programa..."
          aria-label="Experiencia y objetivos"
          className="w-full border border-[#D4A017]/30 bg-white px-4 py-3 text-sm text-[#0D1B2A] placeholder-[#9CA3AF] focus:border-[#D4A017] focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#23364D]">Idioma preferido</label>
          <div className="flex gap-2">
            {(['es', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`border px-4 py-2 text-sm font-semibold transition ${
                  language === lang
                    ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#0D1B2A]'
                    : 'border-[#D4A017]/30 text-[#23364D] hover:border-[#D4A017]'
                }`}
              >
                {lang === 'es' ? 'Español' : 'Русский'}
              </button>
            ))}
          </div>
        </div>
        {hasOfficialCertification && (
          <label className="flex items-center gap-2 text-sm text-[#23364D]">
            <input
              type="checkbox"
              checked={certificationInterest}
              onChange={(e) => setCertificationInterest(e.target.checked)}
              className="h-4 w-4 accent-[#D4A017]"
            />
            Me interesa la certificación oficial ADGD0210
          </label>
        )}
      </div>

      {error && (
        <p role="alert" aria-live="assertive" className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !name || !email}
        className="inline-flex min-h-12 w-full items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Solicitar información'}
      </button>
    </form>
  );
}
