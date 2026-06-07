'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Building2, CheckCircle2, Plug, User,
  Loader2, ChevronRight, ChevronLeft, Zap,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProfileStep {
  full_name: string;
  phone: string;
}

interface CompanyStep {
  skip: boolean;
  razon_social: string;
  cif_nif: string;
  forma_juridica: 'autonomo' | 'sl' | 'sa' | 'otra';
}

type Step = 'profile' | 'company' | 'holded' | 'done';

const STEPS: Step[] = ['profile', 'company', 'holded', 'done'];

const STEP_LABELS: Record<Step, string> = {
  profile: 'Tu perfil',
  company: 'Tu empresa',
  holded: 'Conectar Holded',
  done: '¡Listo!',
};

// ── Step indicators ────────────────────────────────────────────────────────────

function StepDot({ step, current, completed }: { step: number; current: number; completed: boolean }) {
  const active = step === current;
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition
      ${completed ? 'bg-[#d7a33a] text-white' : active ? 'bg-[#07111d] text-white' : 'bg-[#f0e8d5] text-[#29384a]/50'}`}
    >
      {completed ? <CheckCircle2 className="h-4 w-4" /> : step + 1}
    </div>
  );
}

function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <StepDot step={i} current={currentStep} completed={i < currentStep} />
            <span className={`text-[10px] font-semibold hidden sm:block ${i === currentStep ? 'text-[#07111d]' : 'text-[#29384a]/40'}`}>
              {STEP_LABELS[step]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mb-4 transition ${i < currentStep ? 'bg-[#d7a33a]' : 'bg-[#d8cbb5]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Profile ────────────────────────────────────────────────────────────

function ProfileStepForm({ value, onChange }: {
  value: ProfileStep;
  onChange: (v: ProfileStep) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7a33a]/15">
          <User className="h-5 w-5 text-[#d7a33a]" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#07111d]">Completa tu perfil</h2>
          <p className="text-xs text-[#29384a]/60">Necesitamos tus datos para preparar tu expediente</p>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#29384a] mb-1.5">Nombre completo *</label>
        <input
          type="text"
          value={value.full_name}
          onChange={(e) => onChange({ ...value, full_name: e.target.value })}
          placeholder="María García López"
          className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/35 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#29384a] mb-1.5">Teléfono</label>
        <input
          type="tel"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="+34 600 000 000"
          className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/35 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
        />
      </div>
    </div>
  );
}

// ── Step 2: Company ────────────────────────────────────────────────────────────

function CompanyStepForm({ value, onChange }: {
  value: CompanyStep;
  onChange: (v: CompanyStep) => void;
}) {
  if (value.skip) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7a33a]/15">
            <Building2 className="h-5 w-5 text-[#d7a33a]" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Añade tu empresa</h2>
            <p className="text-xs text-[#29384a]/60">Puedes hacerlo más tarde desde el panel</p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-8 text-center space-y-3">
          <Building2 className="mx-auto h-8 w-8 text-[#d8cbb5]" />
          <p className="text-sm text-[#29384a]/60">Omitido — podrás añadir tu empresa más tarde</p>
          <button
            type="button"
            onClick={() => onChange({ ...value, skip: false })}
            className="text-xs font-semibold text-[#d7a33a] underline underline-offset-2"
          >
            Añadir ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7a33a]/15">
            <Building2 className="h-5 w-5 text-[#d7a33a]" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Tu empresa</h2>
            <p className="text-xs text-[#29384a]/60">Datos básicos de tu sociedad o actividad</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, skip: true })}
          className="text-xs text-[#29384a]/50 hover:text-[#29384a] transition"
        >
          Omitir
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#29384a] mb-1.5">Forma jurídica *</label>
        <div className="grid grid-cols-2 gap-2">
          {([['autonomo', 'Autónomo'], ['sl', 'S.L.'], ['sa', 'S.A.'], ['otra', 'Otra']] as const).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...value, forma_juridica: v })}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                value.forma_juridica === v
                  ? 'border-[#d7a33a] bg-[#d7a33a]/10 text-[#07111d]'
                  : 'border-[#d8cbb5] bg-[#f8f4eb] text-[#29384a]/60 hover:border-[#d7a33a]/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#29384a] mb-1.5">
          Razón social / Nombre *
        </label>
        <input
          type="text"
          value={value.razon_social}
          onChange={(e) => onChange({ ...value, razon_social: e.target.value })}
          placeholder={value.forma_juridica === 'autonomo' ? 'María García López' : 'Mi Empresa, S.L.'}
          className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/35 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#29384a] mb-1.5">
          NIF / CIF <span className="font-normal text-[#29384a]/50">(opcional)</span>
        </label>
        <input
          type="text"
          value={value.cif_nif}
          onChange={(e) => onChange({ ...value, cif_nif: e.target.value.toUpperCase() })}
          placeholder="B12345678 / 12345678Z"
          className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 font-mono text-sm text-[#07111d] placeholder-[#29384a]/35 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
        />
      </div>
    </div>
  );
}

// ── Step 3: Holded ────────────────────────────────────────────────────────────

function HoldedStep({ onSkip, onConnect }: { onSkip: () => void; onConnect: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
          <Plug className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#07111d]">Conectar Holded</h2>
          <p className="text-xs text-[#29384a]/60">Sincroniza tu contabilidad y facturación</p>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5 space-y-3">
        <p className="text-sm font-semibold text-[#07111d]">¿Por qué conectar Holded?</p>
        <ul className="space-y-1.5 text-xs text-[#29384a]">
          {[
            'Kia puede consultarte el estado de tu tesorería en tiempo real',
            'Sincronizamos automáticamente facturas y contactos',
            'Recibe alertas de anomalías contables antes de las revisiones',
          ].map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Zap className="h-3.5 w-3.5 shrink-0 text-purple-500 mt-0.5" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onConnect}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#07111d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0d1f30]"
        >
          <Plug className="h-4 w-4" />
          Conectar Holded ahora
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl border border-[#d8cbb5] px-5 py-3 text-sm font-semibold text-[#29384a] transition hover:bg-[#f8f4eb]"
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Done ──────────────────────────────────────────────────────────────

function DoneStep({ onGo }: { onGo: () => void }) {
  return (
    <div className="py-4 text-center space-y-5">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d7a33a]/15">
          <CheckCircle2 className="h-9 w-9 text-[#d7a33a]" />
        </div>
      </div>
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#07111d]">¡Todo listo!</h2>
        <p className="mt-2 text-sm text-[#29384a]/70">
          Tu cuenta está configurada. Ahora puedes consultar el estado de tus trámites,
          subir documentos y hablar con Kia, tu copiloto.
        </p>
      </div>
      <button
        type="button"
        onClick={onGo}
        className="mx-auto flex items-center gap-2 rounded-xl bg-[#d7a33a] px-6 py-3 text-sm font-bold text-[#061321] transition hover:bg-[#c88b25]"
      >
        Ir a mi panel
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileStep>({ full_name: '', phone: '' });
  const [companyData, setCompanyData] = useState<CompanyStep>({
    skip: false,
    razon_social: '',
    cif_nif: '',
    forma_juridica: 'sl',
  });

  const step = STEPS[currentStep] ?? 'profile';

  async function saveProfile(): Promise<boolean> {
    if (!profileData.full_name.trim()) {
      setError('El nombre completo es obligatorio.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileData.full_name.trim(),
          ...(profileData.phone.trim() ? { phone: profileData.phone.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Error guardando perfil.');
        return false;
      }
      return true;
    } catch {
      setError('Error de conexión.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function saveCompany(): Promise<boolean> {
    if (companyData.skip) return true;
    if (!companyData.razon_social.trim()) {
      setError('La razón social es obligatoria.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razon_social: companyData.razon_social.trim(),
          cif_nif: companyData.cif_nif.trim() || undefined,
          forma_juridica: companyData.forma_juridica,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Error creando empresa.');
        return false;
      }
      return true;
    } catch {
      setError('Error de conexión.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    setError(null);
    if (step === 'profile') {
      const ok = await saveProfile();
      if (ok) setCurrentStep((s) => s + 1);
    } else if (step === 'company') {
      const ok = await saveCompany();
      if (ok) setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setError(null);
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function handleHoldedConnect() {
    router.push('/dashboard/integraciones/holded');
  }

  function handleHoldedSkip() {
    setCurrentStep((s) => s + 1);
  }

  async function handleDone() {
    // Mark onboarding as completed (non-blocking — best effort)
    fetch('/api/dashboard/onboarding/complete', { method: 'POST' }).catch(() => {});
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f8f4eb] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d7a33a]">Bienvenido</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Configura tu cuenta</h1>
          <p className="mt-1 text-xs text-[#29384a]/60">Solo te llevará 2 minutos</p>
        </div>

        <StepBar currentStep={currentStep} />

        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {step === 'profile' && (
            <>
              <ProfileStepForm value={profileData} onChange={setProfileData} />
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#c88b25] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Continuar
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 'company' && (
            <>
              <CompanyStepForm value={companyData} onChange={setCompanyData} />
              <div className="mt-6 flex items-center justify-between">
                <button type="button" onClick={handleBack} className="flex items-center gap-1 text-sm text-[#29384a]/60 hover:text-[#29384a] transition">
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#c88b25] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Continuar
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 'holded' && (
            <HoldedStep onSkip={handleHoldedSkip} onConnect={handleHoldedConnect} />
          )}

          {step === 'done' && <DoneStep onGo={handleDone} />}
        </div>

        {/* Skip all */}
        {step !== 'done' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="text-xs text-[#29384a]/40 hover:text-[#29384a]/70 transition"
            >
              Completar más tarde →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
