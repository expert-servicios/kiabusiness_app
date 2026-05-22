'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, CheckCircle2, Loader2, User, Phone } from 'lucide-react';

interface Profile {
  full_name : string | null;
  phone     : string | null;
}

interface ServiceInfo {
  name         : string;
  priceId      : string;
  displayPrice : string;
  slug         : string;
  category     : string;
}

interface Props {
  userId  : string;
  profile : Profile | null;
  service : ServiceInfo;
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function ProfileCompletionWizard({ userId, profile, service }: Props) {
  const needsProfile = !profile?.full_name || !profile?.phone;

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone,    setPhone]    = useState(profile?.phone ?? '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(!needsProfile);
  const [saveErr,  setSaveErr]  = useState<string | null>(null);

  const [checking,  setChecking]  = useState(false);
  const [checkErr,  setCheckErr]  = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq('id', userId);
      if (error) throw error;
      setSaved(true);
    } catch {
      setSaveErr('No hemos podido guardar tus datos. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    setChecking(true);
    setCheckErr(null);
    try {
      const res  = await fetch('/api/services/checkout', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ priceId: service.priceId }),
      });
      const data = await res.json() as { url?: string; error?: string; requiresAuth?: boolean };
      if (res.status === 401 || data.requiresAuth) {
        window.location.href = `/auth/login?next=/contratar?service=${service.slug}`;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckErr(data.error ?? 'No hemos podido iniciar el pago.');
    } catch {
      setCheckErr('No hemos podido iniciar el pago.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Service summary */}
      <div className="rounded-2xl border border-[#D4A017]/30 bg-[#F8F6F1] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Servicio seleccionado</p>
        <p className="mt-1 text-lg font-semibold text-[#0D1B2A]">{service.name}</p>
        <p className="text-sm font-bold text-[#D4A017]">{service.displayPrice}</p>
      </div>

      {/* Profile step */}
      {!saved ? (
        <div className="rounded-2xl border border-[#D4A017]/20 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="font-semibold text-[#0D1B2A]">Antes de pagar, confirma tus datos</p>
            <p className="mt-1 text-sm text-[#23364D]/60">
              Necesitamos tu nombre y teléfono para gestionar tu expediente.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="wcz-name" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#23364D]/60">
                Nombre completo
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4A017]" />
                <input
                  id="wcz-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="w-full rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] py-3 pl-9 pr-4 text-sm text-[#0D1B2A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="wcz-phone" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#23364D]/60">
                Teléfono de contacto
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4A017]" />
                <input
                  id="wcz-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 6XX XXX XXX"
                  required
                  className="w-full rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] py-3 pl-9 pr-4 text-sm text-[#0D1B2A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                />
              </div>
            </div>

            {saveErr && <p className="text-xs font-semibold text-red-700">{saveErr}</p>}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] py-3 text-sm font-bold text-white transition hover:bg-[#23364D] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-semibold text-green-800">Datos confirmados</p>
        </div>
      )}

      {/* Checkout step */}
      {saved && (
        <div className="space-y-3">
          {checkErr && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{checkErr}</p>
          )}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-4 text-base font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
          >
            {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {checking ? 'Redirigiendo a Stripe...' : `Pagar — ${service.displayPrice}`}
          </button>
          <p className="text-center text-xs text-[#23364D]/50">
            Pago seguro con Stripe. El total con IVA se confirma en la pasarela.
          </p>
        </div>
      )}
    </div>
  );
}
