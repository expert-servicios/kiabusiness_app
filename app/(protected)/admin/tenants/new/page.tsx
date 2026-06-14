'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, Palette, Plug, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type Plan = 'starter' | 'pro' | 'enterprise';

interface Step1Data { name: string; slug: string; domain: string; plan: Plan; }
interface Step2Data { brand_name: string; tagline: string; primary_color: string; support_email: string; }
interface Step3Data { holdedKey: string; }

const PLAN_DESC: Record<Plan, string> = {
  starter:    'Hasta 50 clientes · Funcionalidades básicas',
  pro:        'Clientes ilimitados · Integraciones · Automatizaciones',
  enterprise: 'Multiusuario · Soporte dedicado · SLA',
};

const DEFAULT_COLOR = '#d7a33a';

export default function NewTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step data
  const [s1, setS1] = useState<Step1Data>({ name: '', slug: '', domain: '', plan: 'starter' });
  const [s2, setS2] = useState<Step2Data>({ brand_name: '', tagline: '', primary_color: DEFAULT_COLOR, support_email: '' });
  const [s3, setS3] = useState<Step3Data>({ holdedKey: '' });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleNameChange = (v: string) => {
    setS1((p) => ({
      ...p,
      name: v,
      slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const handleFinish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // 1. Create tenant
      const createRes = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: s1.name.trim(),
          slug: s1.slug.trim(),
          domain: s1.domain.trim() || undefined,
          plan: s1.plan,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) { setError(createData.error ?? 'Error al crear el tenant'); return; }
      const tenantId: string = createData.tenant.id;

      // 2. Save branding if any field is set
      const hasBranding = s2.brand_name || s2.tagline || s2.primary_color !== DEFAULT_COLOR || s2.support_email;
      if (hasBranding) {
        const settings: Record<string, string> = {};
        if (s2.brand_name)   settings.name          = s2.brand_name.trim();
        if (s2.tagline)      settings.tagline        = s2.tagline.trim();
        if (s2.primary_color !== DEFAULT_COLOR) settings.primary_color = s2.primary_color;
        if (s2.support_email) settings.support_email = s2.support_email.trim();

        await fetch(`/api/admin/tenants/${tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        });
      }

      // 3. Save Holded key if provided
      if (s3.holdedKey.trim()) {
        await fetch(`/api/admin/tenants/${tenantId}/integrations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ integration: 'holded', secret: s3.holdedKey.trim() }),
        });
      }

      router.push(`/admin/tenants/${tenantId}`);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/tenants" className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e8d5]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">Nueva asesoría</h1>
          <p className="text-sm text-[#29384a]">Paso {step} de 3</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {([
          { n: 1, Icon: Building2, label: 'Identidad' },
          { n: 2, Icon: Palette,   label: 'Marca' },
          { n: 3, Icon: Plug,      label: 'Integración' },
        ] as const).map(({ n, Icon, label }, i) => (
          <div key={n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                step > n ? 'bg-green-500 text-white' :
                step === n ? 'bg-[#d7a33a] text-[#061321]' :
                'bg-[#e8dfc9] text-[#29384a]'
              }`}>
                {step > n ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <p className="hidden text-[10px] font-semibold text-[#29384a] sm:block">{label}</p>
            </div>
            {i < 2 && <div className={`mx-2 h-0.5 flex-1 ${step > n ? 'bg-green-400' : 'bg-[#e8dfc9]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Identity */}
      {step === 1 && (
        <div className="space-y-5 rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <h2 className="font-semibold text-[#07111d]">Datos de la asesoría</h2>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">Nombre *</label>
            <input
              type="text"
              required
              value={s1.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Gestoría López & Asociados"
              className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">Slug *</label>
            <input
              type="text"
              required
              value={s1.slug}
              onChange={(e) => setS1((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              placeholder="gestoria-lopez"
              className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 font-mono text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
            />
            <p className="mt-1 text-xs text-[#29384a]/60">Solo letras minúsculas, números y guiones.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">
              Dominio <span className="font-normal text-[#29384a]">(opcional)</span>
            </label>
            <input
              type="text"
              value={s1.domain}
              onChange={(e) => setS1((p) => ({ ...p, domain: e.target.value }))}
              placeholder="gestorialopez.com"
              className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#07111d]">Plan</label>
            <div className="space-y-2">
              {(['starter', 'pro', 'enterprise'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setS1((prev) => ({ ...prev, plan: p }))}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    s1.plan === p
                      ? 'border-[#d7a33a] bg-[#d7a33a]/8'
                      : 'border-[#d8cbb5] hover:border-[#d7a33a]/50'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${s1.plan === p ? 'border-[#d7a33a] bg-[#d7a33a]' : 'border-[#d8cbb5]'}`} />
                  <div>
                    <p className="text-sm font-semibold capitalize text-[#07111d]">{p}</p>
                    <p className="text-xs text-[#29384a]/70">{PLAN_DESC[p]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!s1.name.trim() || !s1.slug.trim()}
            onClick={() => setStep(2)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-3 text-sm font-bold uppercase tracking-wide text-[#061321] transition hover:bg-[#c88b25] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Branding */}
      {step === 2 && (
        <div className="space-y-5 rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <h2 className="font-semibold text-[#07111d]">Marca de la asesoría</h2>
          <p className="text-xs text-[#29384a]/60">Todos los campos son opcionales. Si los rellenas, los emails y el portal de esta asesoría usarán su propia identidad.</p>

          {/* Live preview strip */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: s2.primary_color || DEFAULT_COLOR }}
          >
            <div className="h-6 w-6 rounded-full bg-white/20" />
            <p className="font-serif text-sm font-bold text-white">
              {s2.brand_name || s1.name || 'Nombre de la asesoría'}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">Nombre en emails</label>
            <input
              type="text"
              value={s2.brand_name}
              onChange={(e) => setS2((p) => ({ ...p, brand_name: e.target.value }))}
              placeholder={s1.name || 'Gestoría López'}
              className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">Tagline</label>
            <input
              type="text"
              value={s2.tagline}
              onChange={(e) => setS2((p) => ({ ...p, tagline: e.target.value }))}
              placeholder="Asesoría Fiscal · Laboral · Mercantil"
              className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">Color de marca</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={s2.primary_color}
                onChange={(e) => setS2((p) => ({ ...p, primary_color: e.target.value }))}
                className="h-10 w-12 cursor-pointer rounded-lg border border-[#d8cbb5] bg-transparent p-0.5"
              />
              <input
                type="text"
                value={s2.primary_color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setS2((p) => ({ ...p, primary_color: v }));
                }}
                placeholder="#d7a33a"
                className="flex-1 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 font-mono text-sm text-[#07111d] focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
              />
              <button
                type="button"
                onClick={() => setS2((p) => ({ ...p, primary_color: DEFAULT_COLOR }))}
                className="shrink-0 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs text-[#29384a] hover:bg-[#f8f4eb]"
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">Email de soporte</label>
            <input
              type="email"
              value={s2.support_email}
              onChange={(e) => setS2((p) => ({ ...p, support_email: e.target.value }))}
              placeholder="info@gestorialopez.com"
              className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm font-semibold text-[#29384a] hover:bg-[#f8f4eb]"
            >
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-2.5 text-sm font-bold uppercase tracking-wide text-[#061321] hover:bg-[#c88b25]"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Integration */}
      {step === 3 && (
        <div className="space-y-5 rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <h2 className="font-semibold text-[#07111d]">Integración Holded</h2>
          <p className="text-xs text-[#29384a]/60">
            Opcional. Si la asesoría usa Holded, introduce su API key para activar la sincronización de empresas y facturas.
            Puedes añadirla o cambiarla después desde el panel del tenant.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#07111d]">API key de Holded</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={s3.holdedKey}
                onChange={(e) => setS3({ holdedKey: e.target.value })}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] py-2.5 pl-4 pr-10 font-mono text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#29384a]/40 hover:text-[#29384a]"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm font-semibold text-[#29384a] hover:bg-[#f8f4eb]"
            >
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-2.5 text-sm font-bold uppercase tracking-wide text-[#061321] hover:bg-[#c88b25] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {submitting ? 'Creando...' : s3.holdedKey.trim() ? 'Crear con Holded' : 'Finalizar sin integración'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
