'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft,
  FileText, Loader2, User, Zap,
} from 'lucide-react';

type ClientType = 'particular' | 'autonomo' | 'empresa';

interface ProfileData {
  full_name?: string | null;
  phone?: string | null;
  client_type?: ClientType | null;
  tax_id?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  province?: string | null;
  onboarding_completed_at?: string | null;
}

const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string; desc: string }[] = [
  { value: 'particular', label: 'Particular', desc: 'Persona física sin actividad empresarial' },
  { value: 'autonomo',   label: 'Autónomo',   desc: 'Trabajo por cuenta propia o freelance' },
  { value: 'empresa',    label: 'Empresa',    desc: 'Sociedad limitada, anónima u otra forma' },
];

const inputCls =
  'w-full rounded-lg border border-[#d8cbb5] bg-[#faf7f2] px-3.5 py-2.5 text-sm text-[#07111d] placeholder-[#7a6e5f] outline-none transition focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [saving, setSaving]           = useState(false);
  const [completing, setCompleting]   = useState(false);
  const [error, setError]             = useState('');
  const [ready, setReady]             = useState(false);

  // Step 1
  const [fullName, setFullName]       = useState('');
  const [phone, setPhone]             = useState('');
  const [clientType, setClientType]   = useState<ClientType>('particular');

  // Step 2
  const [taxId, setTaxId]             = useState('');
  const [company, setCompany]         = useState('');
  const [address, setAddress]         = useState('');
  const [city, setCity]               = useState('');
  const [postalCode, setPostalCode]   = useState('');
  const [province, setProvince]       = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: ProfileData } | null) => {
        const p = data?.profile ?? {};
        if (p.onboarding_completed_at) { router.replace('/dashboard'); return; }
        if (p.full_name)    setFullName(p.full_name);
        if (p.phone)        setPhone(p.phone);
        if (p.client_type)  setClientType(p.client_type);
        if (p.tax_id)       setTaxId(p.tax_id);
        if (p.company)      setCompany(p.company);
        if (p.address)      setAddress(p.address);
        if (p.city)         setCity(p.city);
        if (p.postal_code)  setPostalCode(p.postal_code);
        if (p.province)     setProvince(p.province);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [router]);

  async function patchProfile(fields: Record<string, unknown>) {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(d.error ?? 'Error al guardar');
    }
  }

  async function handleStep1() {
    if (!fullName.trim()) { setError('Introduce tu nombre completo'); return; }
    setSaving(true);
    setError('');
    try {
      await patchProfile({
        full_name:   fullName.trim(),
        phone:       phone.trim() || undefined,
        client_type: clientType,
      });
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleStep2() {
    setSaving(true);
    setError('');
    try {
      const fields: Record<string, unknown> = {};
      if (taxId.trim())      fields.tax_id      = taxId.trim();
      if (company.trim())    fields.company     = company.trim();
      else if (clientType === 'particular') fields.company = null;
      if (address.trim())    fields.address     = address.trim();
      if (city.trim())       fields.city        = city.trim();
      if (postalCode.trim()) fields.postal_code = postalCode.trim();
      if (province.trim())   fields.province    = province.trim();
      if (Object.keys(fields).length > 0) await patchProfile(fields);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteAndGo(to: string) {
    setCompleting(true);
    setError('');
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' });
      router.push(to);
    } catch {
      setError('Error al finalizar. Intenta de nuevo.');
      setCompleting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f4eb]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d7a33a]" />
      </div>
    );
  }

  const needsCompanyField = clientType === 'autonomo' || clientType === 'empresa';
  const stepLabels = ['Tu perfil', 'Datos fiscales', 'Listo'];

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      {/* Header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7a33a]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-serif text-lg font-bold text-[#07111d]">Configuración inicial</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-10">
        {/* Step indicator */}
        <div className="mb-8 flex items-start">
          {([1, 2, 3] as const).map((s, i) => (
            <div key={s} className="flex flex-1 items-start">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step > s
                      ? 'bg-[#d7a33a] text-white'
                      : step === s
                      ? 'bg-[#07111d] text-white'
                      : 'bg-[#e8dfc8] text-[#7a6e5f]'
                  }`}
                >
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <span className="whitespace-nowrap text-[10px] font-medium text-[#7a6e5f]">
                  {stepLabels[s - 1]}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`mt-4 h-px flex-1 mx-2 ${step > s ? 'bg-[#d7a33a]' : 'bg-[#d8cbb5]'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Wizard card */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">

          {/* ── STEP 1: Perfil ── */}
          {step === 1 && (
            <>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/15">
                  <User className="h-4 w-4 text-[#d7a33a]" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#07111d]">¿Quién eres?</h2>
                  <p className="text-xs text-[#29384a]/60">Paso 1 de 2</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#07111d]">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleStep1(); }}
                    placeholder="Ej. María García López"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#07111d]">
                    Teléfono <span className="text-[#7a6e5f] font-normal">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleStep1(); }}
                    placeholder="+34 600 000 000"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#07111d]">Tipo de cliente</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CLIENT_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setClientType(opt.value)}
                        className={`rounded-xl border p-3 text-left transition ${
                          clientType === opt.value
                            ? 'border-[#d7a33a] bg-[#d7a33a]/8 ring-1 ring-[#d7a33a]/30'
                            : 'border-[#d8cbb5] bg-[#faf7f2] hover:border-[#d7a33a]/50'
                        }`}
                      >
                        <p className="text-xs font-semibold text-[#07111d]">{opt.label}</p>
                        <p className="mt-0.5 text-[10px] leading-tight text-[#7a6e5f]">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleStep1}
                disabled={saving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-3 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54] disabled:opacity-60"
              >
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><span>Continuar</span><ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </>
          )}

          {/* ── STEP 2: Fiscal ── */}
          {step === 2 && (
            <>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/15">
                  <FileText className="h-4 w-4 text-[#d7a33a]" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#07111d]">Datos fiscales</h2>
                  <p className="text-xs text-[#29384a]/60">Para facturación y trámites — todos opcionales</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`grid gap-3 ${needsCompanyField ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#07111d]">
                      {clientType === 'empresa' ? 'CIF' : 'NIF / DNI'}
                    </label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                      placeholder={clientType === 'empresa' ? 'B12345678' : '12345678A'}
                      className={`${inputCls} font-mono uppercase`}
                    />
                  </div>
                  {needsCompanyField && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#07111d]">
                        {clientType === 'empresa' ? 'Razón social' : 'Nombre del negocio'}
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder={clientType === 'empresa' ? 'Mi Empresa S.L.' : 'Mi negocio'}
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#07111d]">
                    Dirección fiscal
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, número, piso..."
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[#07111d]">Localidad</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Madrid"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#07111d]">C.P.</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="28001"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#07111d]">
                    Provincia <span className="text-[#7a6e5f] font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Madrid"
                    className={inputCls}
                  />
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(1); }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-4 py-3 text-sm font-medium text-[#29384a] transition hover:bg-[#f8f4eb]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleStep2}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-3 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54] disabled:opacity-60"
                >
                  {saving
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><span>Continuar</span><ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#07111d]">¡Todo listo!</h2>
              <p className="mt-2 text-sm text-[#29384a]/70">
                Tu cuenta está configurada. Ya puedes gestionar tus trámites y usar Kia, tu asistente IA.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => handleCompleteAndGo('/dashboard')}
                  disabled={completing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-3 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54] disabled:opacity-60"
                >
                  {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ir al panel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteAndGo('/dashboard/expedientes')}
                  disabled={completing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8cbb5] py-3 text-sm font-medium text-[#29384a] transition hover:bg-[#f8f4eb] disabled:opacity-60"
                >
                  Ver mis expedientes
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-[#7a6e5f]">
          Puedes actualizar estos datos en cualquier momento desde{' '}
          <Link href="/dashboard/perfil" className="underline hover:text-[#d7a33a]">
            tu perfil
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
