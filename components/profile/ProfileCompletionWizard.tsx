'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, Building2, CheckCircle2, Home, IdCard, Loader2, MapPin, Phone, User } from 'lucide-react';

interface Profile {
  full_name: string | null;
  phone: string | null;
  client_type: 'particular' | 'autonomo' | 'empresa' | null;
  company: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  billing_country: string | null;
  habitual_address: string | null;
  habitual_city: string | null;
  habitual_postal_code: string | null;
  habitual_province: string | null;
  habitual_country: string | null;
  profile_completed: boolean | null;
  billing_ready: boolean | null;
  habitual_address_ready: boolean | null;
}

interface ServiceInfo {
  name: string;
  priceId: string;
  displayPrice: string;
  slug: string;
  category: string;
}

interface Props {
  profile: Profile | null;
  service: ServiceInfo;
}

type CheckoutResponse = {
  url?: string;
  error?: string;
  requiresAuth?: boolean;
  code?: 'profile_required' | 'billing_required';
};

function text(v: string | null | undefined) {
  return v ?? '';
}

export function ProfileCompletionWizard({ profile, service }: Props) {
  const [fullName, setFullName] = useState(text(profile?.full_name));
  const [phone, setPhone] = useState(text(profile?.phone));
  const [clientType, setClientType] = useState<'particular' | 'autonomo' | 'empresa'>(profile?.client_type ?? 'particular');
  const [company, setCompany] = useState(text(profile?.company));
  const [taxId, setTaxId] = useState(text(profile?.tax_id));
  const [address, setAddress] = useState(text(profile?.address));
  const [city, setCity] = useState(text(profile?.city));
  const [postalCode, setPostalCode] = useState(text(profile?.postal_code));
  const [province, setProvince] = useState(text(profile?.province));
  const [billingCountry, setBillingCountry] = useState(text(profile?.billing_country) || 'ES');
  const [sameHabitual, setSameHabitual] = useState(
    !profile?.habitual_address || profile.habitual_address === profile.address
  );
  const [habitualAddress, setHabitualAddress] = useState(text(profile?.habitual_address));
  const [habitualCity, setHabitualCity] = useState(text(profile?.habitual_city));
  const [habitualPostalCode, setHabitualPostalCode] = useState(text(profile?.habitual_postal_code));
  const [habitualProvince, setHabitualProvince] = useState(text(profile?.habitual_province));
  const [habitualCountry, setHabitualCountry] = useState(text(profile?.habitual_country) || 'ES');

  const initialReady = Boolean(profile?.profile_completed && profile?.billing_ready);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initialReady);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [checking, setChecking] = useState(false);
  const [checkErr, setCheckErr] = useState<string | null>(null);

  const isCompany = clientType === 'empresa';
  const canSave = useMemo(() => {
    const baseReady = fullName.trim() && phone.trim() && clientType && taxId.trim() && address.trim() && city.trim() && postalCode.trim();
    const companyReady = !isCompany || company.trim();
    const habitualReady = isCompany || sameHabitual || (habitualAddress.trim() && habitualCity.trim() && habitualPostalCode.trim());
    return Boolean(baseReady && companyReady && habitualReady);
  }, [address, city, clientType, company, fullName, habitualAddress, habitualCity, habitualPostalCode, isCompany, phone, postalCode, sameHabitual, taxId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setSaveErr(null);
    setCheckErr(null);

    const resolvedHabitual = sameHabitual || isCompany
      ? { habitual_address: address.trim(), habitual_city: city.trim(), habitual_postal_code: postalCode.trim(), habitual_province: province.trim() || null, habitual_country: billingCountry.trim().toUpperCase() || 'ES' }
      : { habitual_address: habitualAddress.trim(), habitual_city: habitualCity.trim(), habitual_postal_code: habitualPostalCode.trim(), habitual_province: habitualProvince.trim() || null, habitual_country: habitualCountry.trim().toUpperCase() || 'ES' };

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          client_type: clientType,
          company: company.trim() || null,
          tax_id: taxId.trim(),
          address: address.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
          province: province.trim() || null,
          billing_country: billingCountry.trim().toUpperCase() || 'ES',
          ...resolvedHabitual,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No hemos podido guardar tus datos.');
      setSaved(true);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'No hemos podido guardar tus datos. Intentalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    setChecking(true);
    setCheckErr(null);
    try {
      const res = await fetch('/api/services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: service.priceId }),
      });
      const data = await res.json() as CheckoutResponse;
      if (res.status === 401 || data.requiresAuth) {
        window.location.href = `/auth/login?next=/contratar?service=${service.slug}`;
        return;
      }
      if (res.status === 409 && (data.code === 'profile_required' || data.code === 'billing_required')) {
        setSaved(false);
        setCheckErr(data.error ?? 'Completa tus datos antes de pagar.');
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
          <div className="mb-5">
            <p className="font-semibold text-[#0D1B2A]">Antes de pagar, confirma tus datos</p>
            <p className="mt-1 text-sm text-[#23364D]/60">Necesitamos perfil y facturacion completos para abrir el expediente correctamente.</p>
          </div>

          <div className="space-y-4">
            <LabeledField icon={<User className="h-4 w-4" />} label="Nombre completo">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputCls} placeholder="Tu nombre completo" />
            </LabeledField>

            <LabeledField icon={<Phone className="h-4 w-4" />} label="Telefono">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} placeholder="+34 6XX XXX XXX" />
            </LabeledField>

            <LabeledField icon={<Building2 className="h-4 w-4" />} label="Tipo de cliente">
              <select value={clientType} onChange={(e) => setClientType(e.target.value as typeof clientType)} className={inputCls}>
                <option value="particular">Particular</option>
                <option value="autonomo">Autonomo</option>
                <option value="empresa">Empresa</option>
              </select>
            </LabeledField>

            {isCompany && (
              <LabeledField icon={<Building2 className="h-4 w-4" />} label="Razon social">
                <input value={company} onChange={(e) => setCompany(e.target.value)} required={isCompany} className={inputCls} placeholder="Nombre de empresa" />
              </LabeledField>
            )}

            <LabeledField icon={<IdCard className="h-4 w-4" />} label="NIF / NIE / CIF">
              <input value={taxId} onChange={(e) => setTaxId(e.target.value)} required className={inputCls} placeholder="Documento fiscal" />
            </LabeledField>

            <LabeledField icon={<MapPin className="h-4 w-4" />} label="Direccion de facturacion">
              <input value={address} onChange={(e) => setAddress(e.target.value)} required className={inputCls} placeholder="Calle, numero, piso" />
            </LabeledField>

            <div className="grid grid-cols-2 gap-3">
              <input value={city} onChange={(e) => setCity(e.target.value)} required className={inputCls} placeholder="Ciudad" />
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required className={inputCls} placeholder="Codigo postal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={province} onChange={(e) => setProvince(e.target.value)} className={inputCls} placeholder="Provincia" />
              <input value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} required className={inputCls} placeholder="ES" maxLength={2} />
            </div>

            {!isCompany && (
              <div className="rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0D1B2A]">
                  <input type="checkbox" checked={sameHabitual} onChange={(e) => setSameHabitual(e.target.checked)} className="h-4 w-4 rounded border-[#D4A017]/30 text-[#D4A017]" />
                  Domicilio habitual igual a facturacion
                </label>
                {!sameHabitual && (
                  <div className="mt-4 space-y-3">
                    <LabeledField icon={<Home className="h-4 w-4" />} label="Domicilio habitual">
                      <input value={habitualAddress} onChange={(e) => setHabitualAddress(e.target.value)} required className={inputCls} placeholder="Calle, numero, piso" />
                    </LabeledField>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={habitualCity} onChange={(e) => setHabitualCity(e.target.value)} required className={inputCls} placeholder="Ciudad" />
                      <input value={habitualPostalCode} onChange={(e) => setHabitualPostalCode(e.target.value)} required className={inputCls} placeholder="Codigo postal" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={habitualProvince} onChange={(e) => setHabitualProvince(e.target.value)} className={inputCls} placeholder="Provincia" />
                      <input value={habitualCountry} onChange={(e) => setHabitualCountry(e.target.value)} required className={inputCls} placeholder="ES" maxLength={2} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {saveErr && <p className="mt-4 text-xs font-semibold text-red-700">{saveErr}</p>}
          {checkErr && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{checkErr}</p>}

          <button type="submit" disabled={saving || !canSave} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] py-3 text-sm font-bold text-white transition hover:bg-[#23364D] disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-semibold text-green-800">Perfil y facturacion confirmados</p>
        </div>
      )}

      {saved && (
        <div className="space-y-3">
          {checkErr && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{checkErr}</p>}
          <button type="button" onClick={handleCheckout} disabled={checking} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-4 text-base font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60">
            {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {checking ? 'Redirigiendo a Stripe...' : `Pagar - ${service.displayPrice}`}
          </button>
          <p className="text-center text-xs text-[#23364D]/50">Pago seguro con Stripe. El total con IVA se confirma en la pasarela.</p>
        </div>
      )}
    </div>
  );
}

function LabeledField({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#23364D]/60">
        <span className="text-[#D4A017]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
