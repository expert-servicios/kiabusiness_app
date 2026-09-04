'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Phone, User } from 'lucide-react';

interface Profile { full_name: string | null; phone: string | null; profile_completed: boolean | null; }
interface ServiceInfo { name: string; priceId: string; displayPrice: string; slug: string; category: string; }
interface Props { profile: Profile | null; service: ServiceInfo; }

type CheckoutResponse = {
  url?: string;
  error?: string;
  requiresAuth?: boolean;
  code?: 'profile_required' | 'company_required' | 'billing_required' | 'company_forbidden';
};

function text(v: string | null | undefined) { return v ?? ''; }

export function ProfileCompletionWizard({ profile, service }: Props) {
  const [fullName, setFullName] = useState(text(profile?.full_name));
  const [phone, setPhone] = useState(text(profile?.phone));
  const initialReady = Boolean(profile?.profile_completed);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initialReady);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkErr, setCheckErr] = useState<string | null>(null);
  const canSave = useMemo(() => Boolean(fullName.trim() && phone.trim()), [fullName, phone]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true); setSaveErr(null); setCheckErr(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No hemos podido guardar tus datos.');
      setSaved(true);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'No hemos podido guardar tus datos. Inténtalo de nuevo.');
    } finally { setSaving(false); }
  };

  const handleCheckout = async () => {
    setChecking(true); setCheckErr(null);
    try {
      const res = await fetch('/api/services/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: service.priceId }),
      });
      const data = await res.json() as CheckoutResponse;
      if (res.status === 401 || data.requiresAuth) {
        window.location.href = `/auth/login?next=/contratar?service=${service.slug}`;
        return;
      }
      if (res.status === 409 && data.code === 'profile_required') {
        setSaved(false);
        setCheckErr(data.error ?? 'Completa tus datos antes de pagar.');
        return;
      }
      if (res.status === 409 && data.code === 'company_required') {
        window.location.href = '/dashboard/empresa/nueva';
        return;
      }
      if (res.status === 409 && data.code === 'billing_required') {
        window.location.href = '/dashboard/empresa';
        return;
      }
      if (res.status === 403 && data.code === 'company_forbidden') {
        window.location.href = '/dashboard/empresa';
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckErr(data.error ?? 'No hemos podido iniciar el pago.');
    } catch {
      setCheckErr('No hemos podido iniciar el pago.');
    } finally { setChecking(false); }
  };

  const inputCls = 'w-full rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] px-4 py-3 text-sm text-[#0D1B2A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20';

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-[#D4A017]/30 bg-[#F8F6F1] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Servicio seleccionado</p>
        <p className="mt-1 text-lg font-semibold text-[#0D1B2A]">{service.name}</p>
        <p className="text-sm font-bold text-[#D4A017]">{service.displayPrice}</p>
      </div>
      {!saved ? (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-[#D4A017]/20 bg-white p-6 shadow-sm">
          <div className="mb-5"><p className="font-semibold text-[#0D1B2A]">Antes de pagar, confirma tus datos</p><p className="mt-1 text-sm text-[#23364D]/60">Necesitamos tu nombre y teléfono para poder contactarte sobre el servicio.</p></div>
          <div className="space-y-4">
            <LabeledField icon={<User className="h-4 w-4" />} label="Nombre completo"><input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputCls} placeholder="Tu nombre completo" /></LabeledField>
            <LabeledField icon={<Phone className="h-4 w-4" />} label="Teléfono"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} placeholder="+34 6XX XXX XXX" /></LabeledField>
          </div>
          {saveErr && <p className="mt-4 text-xs font-semibold text-red-700">{saveErr}</p>}
          {checkErr && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{checkErr}</p>}
          <button type="submit" disabled={saving || !canSave} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] py-3 text-sm font-bold text-white transition hover:bg-[#23364D] disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? 'Guardando...' : 'Guardar y continuar'}</button>
        </form>
      ) : <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /><p className="text-sm font-semibold text-green-800">Datos confirmados</p></div>}
      {saved && <div className="space-y-3">
        {checkErr && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{checkErr}</p>}
        <button type="button" onClick={handleCheckout} disabled={checking} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-4 text-base font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60">{checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}{checking ? 'Redirigiendo a Stripe...' : `Pagar - ${service.displayPrice}`}</button>
        <p className="text-center text-xs text-[#23364D]/50">Pago seguro con Stripe. La contratación queda asociada a la entidad activa y Stripe confirma los datos fiscales del pago.</p>
      </div>}
    </div>
  );
}

function LabeledField({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#23364D]/60"><span className="text-[#D4A017]">{icon}</span>{label}</span>{children}</label>;
}