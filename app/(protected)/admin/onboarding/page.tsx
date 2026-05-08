'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown,
  Loader2, Mail, User, UserPlus
} from 'lucide-react';
import { ADMIN_CATALOG, type CatalogItem } from '@/lib/utils/admin-catalog';

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientForm {
  email: string;
  fullName: string;
  company: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  postalCode: string;
  mode: 'admin_fill' | 'invite_email';
}

interface ServiceForm {
  selectedItem: CatalogItem | null;
  title: string;
  description: string;
  amountEur: string;
  expiresInDays: string;
  docsChecklist: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Cliente', 'Servicio', 'Confirmación'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  done
                    ? 'bg-[#d7a33a] text-[#07111d]'
                    : active
                    ? 'border-2 border-[#d7a33a] bg-white text-[#07111d]'
                    : 'border-2 border-[#d8cbb5] bg-white text-[#8a9aab]'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`mt-1 text-xs font-semibold ${
                  active ? 'text-[#07111d]' : done ? 'text-[#d7a33a]' : 'text-[#8a9aab]'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mb-4 h-px w-12 transition-all sm:w-20 ${done ? 'bg-[#d7a33a]' : 'bg-[#d8cbb5]'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Catalog picker ───────────────────────────────────────────────────────────

function CatalogPicker({
  selected,
  onSelect
}: {
  selected: CatalogItem | null;
  onSelect: (item: CatalogItem) => void;
}) {
  const [tab, setTab] = useState<'plan' | 'servicio' | 'formacion'>('plan');
  const items = ADMIN_CATALOG.filter((i) => i.category === tab);

  return (
    <div>
      <div className="flex gap-1 border-b border-[#d8cbb5]">
        {(['plan', 'servicio', 'formacion'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === t
                ? 'border-b-2 border-[#d7a33a] text-[#07111d]'
                : 'text-[#8a9aab] hover:text-[#07111d]'
            }`}
          >
            {t === 'plan' ? 'Planes' : t === 'formacion' ? 'Formación' : 'Servicios'}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
              selected?.id === item.id
                ? 'border-[#d7a33a] bg-[#d7a33a]/5'
                : 'border-[#d8cbb5] hover:border-[#d7a33a]/50'
            }`}
          >
            <div
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                selected?.id === item.id ? 'border-[#d7a33a] bg-[#d7a33a]' : 'border-[#d8cbb5]'
              }`}
            >
              {selected?.id === item.id && <Check className="h-2.5 w-2.5 text-white" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#07111d]">{item.label}</p>
              <p className="mt-0.5 text-xs text-[#29384a] line-clamp-2">{item.description}</p>
              <p className="mt-1 text-xs font-bold text-[#d7a33a]">
                {item.mode === 'subscription'
                  ? `€${item.suggestedPrice}/mes`
                  : `€${item.suggestedPrice}`}
                {item.subcategory && (
                  <span className="ml-2 font-normal text-[#8a9aab]">{item.subcategory}</span>
                )}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function FieldRow({
  label,
  children,
  required
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-[#07111d]">
        {label} {required && <span className="text-[#d7a33a]">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm text-[#07111d] placeholder-[#8a9aab] focus:border-[#d7a33a] focus:outline-none';

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 state
  const [client, setClient] = useState<ClientForm>({
    email: '',
    fullName: '',
    company: '',
    phone: '',
    taxId: '',
    address: '',
    city: '',
    postalCode: '',
    mode: 'invite_email'
  });
  const [createdUserId, setCreatedUserId] = useState('');
  const [userIsNew, setUserIsNew] = useState(false);

  // Step 2 state
  const [service, setService] = useState<ServiceForm>({
    selectedItem: null,
    title: '',
    description: '',
    amountEur: '',
    expiresInDays: '14',
    docsChecklist: ''
  });

  // Step 3 result
  const [result, setResult] = useState<{ stripeUrl?: string; quoteId?: string } | null>(null);

  function setClientField(k: keyof ClientForm, v: string) {
    setClient((p) => ({ ...p, [k]: v }));
  }

  function setServiceField(k: keyof ServiceForm, v: string | CatalogItem | null) {
    setService((p) => ({ ...p, [k]: v }));
  }

  function onCatalogSelect(item: CatalogItem) {
    setService((p) => ({
      ...p,
      selectedItem: item,
      title: item.label,
      description: item.description,
      amountEur: String(item.suggestedPrice)
    }));
  }

  // ── Step 1 submit ─────────────────────────────────────────────────────────

  async function handleStep1() {
    if (!client.email) { setError('El email es obligatorio.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: client.email,
          fullName: client.fullName || undefined,
          company: client.company || undefined,
          phone: client.phone || undefined,
          taxId: client.taxId || undefined,
          address: client.address || undefined,
          city: client.city || undefined,
          postalCode: client.postalCode || undefined,
          mode: client.mode
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? 'Error al crear usuario'); return; }
      setCreatedUserId(data.userId);
      setUserIsNew(data.isNewUser);
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 submit ─────────────────────────────────────────────────────────

  async function handleStep2() {
    if (!service.title) { setError('Selecciona o escribe un servicio.'); return; }
    if (!service.amountEur || isNaN(Number(service.amountEur))) { setError('El importe debe ser un número.'); return; }
    setStep(2);
    setError('');
  }

  // ── Step 3 send ───────────────────────────────────────────────────────────

  async function handleSend() {
    setLoading(true);
    setError('');
    try {
      const item = service.selectedItem;
      const isPlan = item?.mode === 'subscription';

      if (isPlan && item?.stripePriceEnvKey) {
        // Send subscription invite
        const res = await fetch('/api/admin/subscriptions/send-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: client.email,
            planName: service.title,
            amountEur: Number(service.amountEur),
            stripePriceEnvKey: item.stripePriceEnvKey
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) { setError(data.error ?? 'Error al enviar enlace'); return; }
        setResult({ stripeUrl: data.stripeUrl });
      } else {
        // Send one-time payment quote
        const docs = service.docsChecklist
          ? service.docsChecklist.split('\n').map(s => s.trim()).filter(Boolean)
          : [];

        const res = await fetch('/api/admin/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: client.email,
            title: service.title,
            description: service.description,
            amountEur: Number(service.amountEur),
            expiresInDays: Number(service.expiresInDays) || 14,
            docsChecklist: docs
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) { setError(data.error ?? 'Error al crear presupuesto'); return; }
        setResult({ stripeUrl: data.stripeUrl, quoteId: data.quoteId });
      }

      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  // ── Completed ────────────────────────────────────────────────────────────

  if (step === 3 && result) {
    const isPlan = service.selectedItem?.mode === 'subscription';
    return (
      <main className="min-h-screen bg-[#f8f4eb]">
        <div className="border-b border-[#d8cbb5] bg-white px-6 py-5">
          <h1 className="font-serif text-xl font-bold text-[#07111d]">Onboarding completado</h1>
        </div>
        <div className="mx-auto max-w-lg px-6 py-12 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[#d7a33a]" />
          <h2 className="mt-6 font-serif text-2xl font-bold text-[#07111d]">
            {isPlan ? '¡Enlace de suscripción enviado!' : '¡Presupuesto enviado!'}
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#29384a]">
            Se ha enviado un email a <strong>{client.email}</strong> con{' '}
            {isPlan ? 'el enlace para activar su suscripción' : 'el presupuesto y el enlace de pago'}.
            El contrato está adjunto en el email.
          </p>

          <div className="mt-6 rounded-xl border border-[#d8cbb5] bg-white p-5 text-left text-sm">
            <p className="font-semibold text-[#07111d]">{client.fullName || client.email}</p>
            {client.company && <p className="text-[#29384a]">{client.company}</p>}
            <p className="mt-2 text-xs text-[#8a9aab]">
              Servicio: <span className="font-semibold text-[#07111d]">{service.title}</span>
            </p>
            <p className="text-xs text-[#8a9aab]">
              Importe: <span className="font-semibold text-[#d7a33a]">
                €{Number(service.amountEur).toFixed(2)}{isPlan ? '/mes' : ''}
              </span>
            </p>
            {result.stripeUrl && (
              <a
                href={result.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block truncate text-xs text-[#c88b25] underline"
              >
                {result.stripeUrl}
              </a>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => { setStep(0); setResult(null); setClient({ email: '', fullName: '', company: '', phone: '', taxId: '', address: '', city: '', postalCode: '', mode: 'invite_email' }); setService({ selectedItem: null, title: '', description: '', amountEur: '', expiresInDays: '14', docsChecklist: '' }); setCreatedUserId(''); }}
              className="w-full rounded-lg bg-[#d7a33a] py-3 text-sm font-bold text-[#07111d] transition hover:bg-[#f2c14e]"
            >
              Nuevo onboarding
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="w-full rounded-lg border border-[#d8cbb5] py-3 text-sm font-semibold text-[#29384a] transition hover:border-[#d7a33a]"
            >
              Volver al panel
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      {/* Header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : router.push('/admin')}
              className="rounded-lg border border-[#d8cbb5] p-2 text-[#29384a] transition hover:border-[#d7a33a]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#07111d]">Nuevo cliente — Onboarding</h1>
              <p className="mt-0.5 text-xs text-[#8a9aab]">Alta manual + presupuesto + envío automático</p>
            </div>
          </div>
          <div className="mt-5">
            <StepIndicator current={step} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── STEP 0: Cliente ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Datos del cliente</h2>
              <p className="mt-1 text-xs text-[#8a9aab]">
                Si el cliente ya existe en el sistema se actualizará su perfil. Si es nuevo, se creará la cuenta.
              </p>

              {/* Mode toggle */}
              <div className="mt-5 flex gap-3">
                {(
                  [
                    { value: 'admin_fill', icon: User, label: 'Relleno yo los datos' },
                    { value: 'invite_email', icon: Mail, label: 'Invitar al cliente por email' }
                  ] as const
                ).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setClientField('mode', value)}
                    className={`flex flex-1 items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                      client.mode === value
                        ? 'border-[#d7a33a] bg-[#d7a33a]/5 text-[#07111d]'
                        : 'border-[#d8cbb5] text-[#8a9aab] hover:border-[#d7a33a]/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {client.mode === 'invite_email' && (
                <p className="mt-2 text-xs text-[#8a9aab]">
                  El cliente recibirá un email de invitación para establecer su contraseña y completar sus datos.
                </p>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FieldRow label="Email" required>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClientField('email', e.target.value)}
                    placeholder="cliente@empresa.com"
                    className={inputCls}
                    required
                  />
                </FieldRow>

                <FieldRow label="Nombre completo" required={client.mode === 'admin_fill'}>
                  <input
                    type="text"
                    value={client.fullName}
                    onChange={(e) => setClientField('fullName', e.target.value)}
                    placeholder="Ilya Ovchinnikov"
                    className={inputCls}
                  />
                </FieldRow>

                <FieldRow label="Empresa / Razón social">
                  <input
                    type="text"
                    value={client.company}
                    onChange={(e) => setClientField('company', e.target.value)}
                    placeholder="INVERSIONES PASO SEGURO, SLU"
                    className={inputCls}
                  />
                </FieldRow>

                <FieldRow label="CIF / NIF / NIE">
                  <input
                    type="text"
                    value={client.taxId}
                    onChange={(e) => setClientField('taxId', e.target.value)}
                    placeholder="B12345678"
                    className={inputCls}
                  />
                </FieldRow>

                <FieldRow label="Teléfono">
                  <input
                    type="tel"
                    value={client.phone}
                    onChange={(e) => setClientField('phone', e.target.value)}
                    placeholder="+34 600 000 000"
                    className={inputCls}
                  />
                </FieldRow>

                <FieldRow label="Código postal">
                  <input
                    type="text"
                    value={client.postalCode}
                    onChange={(e) => setClientField('postalCode', e.target.value)}
                    placeholder="03110"
                    className={inputCls}
                  />
                </FieldRow>

                <FieldRow label="Dirección">
                  <input
                    type="text"
                    value={client.address}
                    onChange={(e) => setClientField('address', e.target.value)}
                    placeholder="C/ Ejemplo, 10"
                    className={inputCls}
                  />
                </FieldRow>

                <FieldRow label="Ciudad">
                  <input
                    type="text"
                    value={client.city}
                    onChange={(e) => setClientField('city', e.target.value)}
                    placeholder="Alicante"
                    className={inputCls}
                  />
                </FieldRow>
              </div>
            </div>

            <button
              onClick={handleStep1}
              disabled={loading || !client.email}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-3.5 text-sm font-bold text-[#07111d] transition hover:bg-[#f2c14e] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Procesando...' : 'Continuar — Elegir servicio'}
            </button>
          </div>
        )}

        {/* ── STEP 1: Servicio ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Client summary */}
            <div className="flex items-center gap-3 rounded-xl border border-[#d8cbb5] bg-white px-5 py-3">
              <UserPlus className="h-5 w-5 shrink-0 text-[#d7a33a]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#07111d]">
                  {client.fullName || client.email}
                  {userIsNew && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Nuevo
                    </span>
                  )}
                </p>
                {client.company && <p className="text-xs text-[#8a9aab]">{client.company}</p>}
                <p className="text-xs text-[#8a9aab]">{client.email}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Selecciona el servicio</h2>
              <p className="mt-1 text-xs text-[#8a9aab]">Elige del catálogo o personaliza título, descripción e importe.</p>

              <div className="mt-5">
                <CatalogPicker
                  selected={service.selectedItem}
                  onSelect={onCatalogSelect}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
              <h2 className="font-serif text-base font-bold text-[#07111d]">
                Personalizar propuesta
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldRow label="Título del servicio" required>
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => setServiceField('title', e.target.value)}
                      placeholder="p.ej. Migración Holded + Formación 4h"
                      className={inputCls}
                    />
                  </FieldRow>
                </div>

                <div className="sm:col-span-2">
                  <FieldRow label="Descripción">
                    <textarea
                      value={service.description}
                      onChange={(e) => setServiceField('description', e.target.value)}
                      rows={3}
                      placeholder="Describe lo que incluye el servicio..."
                      className={`${inputCls} resize-none`}
                    />
                  </FieldRow>
                </div>

                <FieldRow label={service.selectedItem?.mode === 'subscription' ? 'Importe mensual (€)' : 'Importe (€)'} required>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={service.amountEur}
                    onChange={(e) => setServiceField('amountEur', e.target.value)}
                    placeholder="490.00"
                    className={inputCls}
                  />
                </FieldRow>

                {service.selectedItem?.mode !== 'subscription' && (
                  <FieldRow label="Validez del presupuesto (días)">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={service.expiresInDays}
                      onChange={(e) => setServiceField('expiresInDays', e.target.value)}
                      className={inputCls}
                    />
                  </FieldRow>
                )}

                {service.selectedItem?.mode !== 'subscription' && (
                  <div className="sm:col-span-2">
                    <FieldRow label="Documentos requeridos (uno por línea)">
                      <textarea
                        value={service.docsChecklist}
                        onChange={(e) => setServiceField('docsChecklist', e.target.value)}
                        rows={4}
                        placeholder={'DNI / NIE en vigor\nCertificado de empadronamiento\nUltimas 3 nóminas'}
                        className={`${inputCls} resize-none font-mono text-xs`}
                      />
                    </FieldRow>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleStep2}
              disabled={!service.title || !service.amountEur}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7a33a] py-3.5 text-sm font-bold text-[#07111d] transition hover:bg-[#f2c14e] disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
              Revisar y enviar
            </button>
          </div>
        )}

        {/* ── STEP 2: Confirmación ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Revisa antes de enviar</h2>
              <p className="mt-1 text-xs text-[#8a9aab]">
                Al confirmar se enviará el email con el {service.selectedItem?.mode === 'subscription' ? 'enlace de suscripción' : 'presupuesto y enlace de pago'} y el contrato adjunto.
              </p>

              <div className="mt-5 divide-y divide-[#f0e9da]">
                <div className="pb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8a9aab]">Cliente</p>
                  <p className="mt-1 font-semibold text-[#07111d]">{client.fullName || '—'}</p>
                  {client.company && <p className="text-sm text-[#29384a]">{client.company}</p>}
                  {client.taxId && <p className="text-xs text-[#8a9aab]">CIF/NIF: {client.taxId}</p>}
                  <p className="text-sm text-[#29384a]">{client.email}</p>
                  {client.phone && <p className="text-xs text-[#8a9aab]">{client.phone}</p>}
                  {userIsNew && (
                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Usuario creado — {client.mode === 'invite_email' ? 'invitación enviada' : 'cuenta lista'}
                    </span>
                  )}
                </div>

                <div className="py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8a9aab]">Servicio</p>
                  <p className="mt-1 font-semibold text-[#07111d]">{service.title}</p>
                  {service.description && (
                    <p className="mt-1 text-sm text-[#29384a]">{service.description}</p>
                  )}
                  <p className="mt-2 text-lg font-bold text-[#d7a33a]">
                    €{Number(service.amountEur).toFixed(2)}
                    {service.selectedItem?.mode === 'subscription' ? '/mes' : ''}
                  </p>
                  {service.selectedItem?.mode !== 'subscription' && (
                    <p className="text-xs text-[#8a9aab]">Válido {service.expiresInDays} días</p>
                  )}
                </div>

                {service.docsChecklist && service.selectedItem?.mode !== 'subscription' && (
                  <div className="pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8a9aab]">Documentación requerida</p>
                    <ul className="mt-2 space-y-1">
                      {service.docsChecklist.split('\n').filter(Boolean).map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#29384a]">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d7a33a]" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                📧 Se enviará un email a <strong>{client.email}</strong> con{' '}
                {service.selectedItem?.mode === 'subscription'
                  ? 'el enlace para activar la suscripción mensual'
                  : 'el presupuesto, el enlace de pago y el contrato adjunto'}
                .
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] px-5 py-3.5 text-sm font-semibold text-[#29384a] transition hover:border-[#d7a33a]"
              >
                <ArrowLeft className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#07111d] py-3.5 text-sm font-bold text-white transition hover:bg-[#0f2035] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {loading ? 'Enviando...' : `Enviar ${service.selectedItem?.mode === 'subscription' ? 'enlace de suscripción' : 'presupuesto'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
