'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Save, CheckCircle2, MessageCircle, KeyRound,
  Mail, AlertCircle, FileText, MapPin,
} from 'lucide-react';
import { CompanyDataLookup } from './CompanyDataLookup';

interface Props {
  email               : string;
  role                : string;
  initialFullName     : string;
  initialPhone        : string;
  initialWhatsappNumber: string;
  initialWhatsappConsent: boolean;
  hasEmailPassword    : boolean;
  // Billing/fiscal fields
  initialClientType   : string;
  initialCompany      : string;
  initialTaxId        : string;
  initialAddress      : string;
  initialCity         : string;
  initialPostalCode   : string;
  initialProvince     : string;
  initialBillingCountry: string;
  initialHabitualAddress: string;
  initialHabitualCity : string;
  initialHabitualPostalCode: string;
  initialHabitualProvince: string;
  initialHabitualCountry: string;
  // Completion flags
  profileCompleted    : boolean;
  billingReady        : boolean;
  habitualAddressReady: boolean;
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  particular: 'Particular',
  autonomo  : 'Autónomo',
  empresa   : 'Empresa / Sociedad',
};

function FieldInput({
  label, value, onChange, type = 'text', placeholder, hint
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">{label}</label>
      {hint && <p className="mt-0.5 text-[10px] text-[#29384a]/70">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
      />
    </div>
  );
}

export function ProfileForm({
  email,
  initialFullName,
  initialPhone,
  initialWhatsappNumber,
  initialWhatsappConsent,
  hasEmailPassword,
  initialClientType,
  initialCompany,
  initialTaxId,
  initialAddress,
  initialCity,
  initialPostalCode,
  initialProvince,
  initialBillingCountry,
  initialHabitualAddress,
  initialHabitualCity,
  initialHabitualPostalCode,
  initialHabitualProvince,
  initialHabitualCountry,
  profileCompleted,
  billingReady,
  habitualAddressReady,
}: Props) {
  // ── Personal ──────────────────────────────────────────────────────────────
  const [fullName,        setFullName]        = useState(initialFullName);
  const [phone,           setPhone]           = useState(initialPhone);
  const [whatsappNumber,  setWhatsappNumber]  = useState(initialWhatsappNumber);
  const [whatsappConsent, setWhatsappConsent] = useState(initialWhatsappConsent);
  const [saving,          setSaving]          = useState(false);
  const [saveMsg,         setSaveMsg]         = useState<{ text: string; ok: boolean } | null>(null);

  // ── Billing ───────────────────────────────────────────────────────────────
  const [clientType,       setClientType]       = useState(initialClientType || 'particular');
  const [company,          setCompany]          = useState(initialCompany);
  const [taxId,            setTaxId]            = useState(initialTaxId);
  const [address,          setAddress]          = useState(initialAddress);
  const [city,             setCity]             = useState(initialCity);
  const [postalCode,       setPostalCode]       = useState(initialPostalCode);
  const [province,         setProvince]         = useState(initialProvince);
  const [billingCountry,   setBillingCountry]   = useState(initialBillingCountry || 'ES');
  const [savingBilling,    setSavingBilling]    = useState(false);
  const [billingMsg,       setBillingMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  // ── Habitual address (personas físicas) ───────────────────────────────────
  const [habitualAddress,       setHabitualAddress]       = useState(initialHabitualAddress);
  const [habitualCity,          setHabitualCity]          = useState(initialHabitualCity);
  const [habitualPostalCode,    setHabitualPostalCode]    = useState(initialHabitualPostalCode);
  const [habitualProvince,      setHabitualProvince]      = useState(initialHabitualProvince);
  const [habitualCountry,       setHabitualCountry]       = useState(initialHabitualCountry || 'ES');
  const [currentBillingReady,   setCurrentBillingReady]   = useState(billingReady);
  const [currentHabitualReady,  setCurrentHabitualReady]  = useState(habitualAddressReady);
  const [currentProfileComplete, setCurrentProfileComplete] = useState(profileCompleted);

  // ── Email / Password ──────────────────────────────────────────────────────
  const [newEmail,     setNewEmail]     = useState('');
  const [emailMsg,     setEmailMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [savingEmail,  setSavingEmail]  = useState(false);
  const [pwdMsg,       setPwdMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [sendingPwd,   setSendingPwd]   = useState(false);

  const getSupabase = () =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, whatsapp_number: whatsappNumber, whatsapp_consent: whatsappConsent }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg({ text: data.error ?? 'Error al guardar', ok: false }); return; }
      setCurrentProfileComplete(data.profile?.profile_completed ?? currentProfileComplete);
      setSaveMsg({ text: 'Perfil actualizado.', ok: true });
    } catch {
      setSaveMsg({ text: 'Error de conexión.', ok: false });
    } finally { setSaving(false); }
  };

  const handleSaveBilling = async () => {
    setSavingBilling(true); setBillingMsg(null);
    try {
      const body: Record<string, unknown> = {
        client_type: clientType,
        tax_id: taxId,
        address, city, postal_code: postalCode, province: province || null,
        billing_country: billingCountry,
      };
      if (clientType === 'empresa') body.company = company;
      if (clientType !== 'empresa') {
        body.habitual_address      = habitualAddress || null;
        body.habitual_city         = habitualCity || null;
        body.habitual_postal_code  = habitualPostalCode || null;
        body.habitual_province     = habitualProvince || null;
        body.habitual_country      = habitualCountry;
      }
      const res = await fetch('/api/profile', {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setBillingMsg({ text: data.error ?? 'Error al guardar', ok: false }); return; }
      setCurrentBillingReady(data.profile?.billing_ready ?? currentBillingReady);
      setCurrentHabitualReady(data.profile?.habitual_address_ready ?? currentHabitualReady);
      setBillingMsg({ text: 'Datos de facturación actualizados.', ok: true });
    } catch {
      setBillingMsg({ text: 'Error de conexión.', ok: false });
    } finally { setSavingBilling(false); }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === email) return;
    setSavingEmail(true); setEmailMsg(null);
    try {
      const { error } = await getSupabase().auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/dashboard/perfil` }
      );
      if (error) { setEmailMsg({ text: error.message, ok: false }); return; }
      setEmailMsg({ text: 'Confirmación enviada a ambas direcciones. Revisa tu correo.', ok: true });
      setNewEmail('');
    } catch { setEmailMsg({ text: 'Error al cambiar el email.', ok: false }); }
    finally { setSavingEmail(false); }
  };

  const handleSendPasswordReset = async () => {
    setSendingPwd(true); setPwdMsg(null);
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) { setPwdMsg({ text: error.message, ok: false }); return; }
      setPwdMsg({ text: 'Enlace de cambio de contraseña enviado a tu correo.', ok: true });
    } catch { setPwdMsg({ text: 'Error al enviar el enlace.', ok: false }); }
    finally { setSendingPwd(false); }
  };

  const isEmpresa = clientType === 'empresa';

  return (
    <div className="space-y-5">

      {/* ── Completion badges ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Badge ok={currentProfileComplete} label="Perfil completo" />
        <Badge ok={currentBillingReady}    label="Datos de facturación" />
        {!isEmpresa && <Badge ok={currentHabitualReady} label="Domicilio habitual" />}
      </div>

      {!currentBillingReady && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Faltan datos de facturación.</strong> Son necesarios antes de contratar cualquier servicio o suscribirte a un plan.
          </p>
        </div>
      )}

      {/* ── Personal data ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Datos personales</p>
        <div className="space-y-4">
          <FieldInput label="Nombre completo" value={fullName} onChange={setFullName} placeholder="Tu nombre y apellidos" />
          <FieldInput label="Teléfono" value={phone} onChange={setPhone} type="tel" placeholder="+34 6XX XXX XXX" />
        </div>

        {/* WhatsApp */}
        <div className="mt-5 rounded-2xl border border-[#d8cbb5] bg-[#f8f4eb] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#07111d]">
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            WhatsApp
          </div>
          <div className="mb-3">
            <FieldInput label="Número de WhatsApp" value={whatsappNumber} onChange={setWhatsappNumber} type="tel" placeholder="+34 6XX XXX XXX" />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox" checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#d8cbb5] text-[#c88b25]"
            />
            <span className="text-xs text-[#29384a] leading-relaxed">
              Acepto recibir notificaciones del estado de mi expediente por WhatsApp.
            </span>
          </label>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <SaveButton saving={saving} onClick={handleSave} />
          {saveMsg && <InlineMsg msg={saveMsg} />}
        </div>
      </div>

      {/* ── Billing data ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#c88b25]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Datos de facturación</p>
        </div>

        <div className="space-y-4">
          {/* Client type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Tipo de cliente</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['particular', 'autonomo', 'empresa'] as const).map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setClientType(t)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                    clientType === t
                      ? 'border-[#c88b25] bg-[#c88b25]/10 text-[#c88b25]'
                      : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]/50'
                  }`}
                >
                  {CLIENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {isEmpresa && (
            <FieldInput label="Razón social" value={company} onChange={setCompany} placeholder="Nombre de la empresa" />
          )}

          <FieldInput
            label={isEmpresa ? 'CIF' : 'NIF / NIE'}
            value={taxId} onChange={setTaxId}
            placeholder={isEmpresa ? 'B12345678' : 'X1234567A'}
            hint="Se usará en las facturas y trámites"
          />

          {isEmpresa && (
            <div className="rounded-2xl border border-[#e8dfc8] bg-[#faf9f6] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#c88b25]">Autocompletar desde fuentes públicas</p>
              <CompanyDataLookup
                company={company}
                taxId={taxId}
                onApply={(data) => {
                  if (data.company)    setCompany(data.company);
                  if (data.taxId)      setTaxId(data.taxId);
                  if (data.address)    setAddress(data.address);
                  if (data.city)       setCity(data.city);
                  if (data.postalCode) setPostalCode(data.postalCode);
                  if (data.province)   setProvince(data.province);
                }}
              />
            </div>
          )}

          <FieldInput label="Dirección de facturación" value={address} onChange={setAddress} placeholder="Calle, número, piso" />

          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Código postal" value={postalCode} onChange={setPostalCode} placeholder="28001" />
            <FieldInput label="Ciudad" value={city} onChange={setCity} placeholder="Madrid" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Provincia" value={province} onChange={setProvince} placeholder="Madrid" />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">País</label>
              <select
                value={billingCountry}
                onChange={(e) => setBillingCountry(e.target.value)}
                aria-label="País de facturación"
                className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
              >
                <option value="ES">España</option>
                <option value="FR">Francia</option>
                <option value="PT">Portugal</option>
                <option value="DE">Alemania</option>
                <option value="GB">Reino Unido</option>
                <option value="RU">Rusia</option>
                <option value="UA">Ucrania</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Habitual address — solo personas físicas */}
        {!isEmpresa && (
          <div className="mt-6 space-y-4 border-t border-[#f0e8d8] pt-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#c88b25]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Domicilio habitual</p>
            </div>
            <p className="text-xs text-[#29384a]">
              Necesario para trámites de extranjería, IRPF y servicios que requieren domicilio fiscal.
            </p>
            <FieldInput label="Dirección" value={habitualAddress} onChange={setHabitualAddress} placeholder="Calle, número, piso" />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Código postal" value={habitualPostalCode} onChange={setHabitualPostalCode} placeholder="28001" />
              <FieldInput label="Ciudad" value={habitualCity} onChange={setHabitualCity} placeholder="Madrid" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Provincia" value={habitualProvince} onChange={setHabitualProvince} placeholder="Madrid" />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">País</label>
                <select
                  value={habitualCountry}
                  onChange={(e) => setHabitualCountry(e.target.value)}
                  aria-label="País del domicilio habitual"
                  className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
                >
                  <option value="ES">España</option>
                  <option value="FR">Francia</option>
                  <option value="PT">Portugal</option>
                  <option value="DE">Alemania</option>
                  <option value="GB">Reino Unido</option>
                  <option value="RU">Rusia</option>
                  <option value="UA">Ucrania</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-4">
          <SaveButton saving={savingBilling} onClick={handleSaveBilling} label="Guardar facturación" />
          {billingMsg && <InlineMsg msg={billingMsg} />}
        </div>
      </div>

      {/* ── Change email ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#c88b25]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Cambiar email</p>
        </div>
        <p className="mb-4 text-xs text-[#29384a]">
          Email actual: <span className="font-semibold text-[#07111d]">{email}</span>
        </p>
        <div className="flex gap-2">
          <input
            type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nuevo@correo.com"
            className="flex-1 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
          />
          <button
            type="button" onClick={handleChangeEmail}
            disabled={savingEmail || !newEmail || newEmail === email}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#07111d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2d40] disabled:opacity-50"
          >
            {savingEmail ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
        {emailMsg && <InlineMsg msg={emailMsg} small />}
        <p className="mt-2 text-[10px] text-[#29384a]">Se enviará un enlace de confirmación a ambas direcciones.</p>
      </div>

      {/* ── Change password ──────────────────────────────────────────────── */}
      {hasEmailPassword && (
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Contraseña</p>
          </div>
          <p className="mb-4 text-xs text-[#29384a]">Recibirás un enlace en tu correo para establecer una nueva contraseña.</p>
          <button
            type="button" onClick={handleSendPasswordReset} disabled={sendingPwd}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-50"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {sendingPwd ? 'Enviando...' : 'Enviar enlace para cambiar contraseña'}
          </button>
          {pwdMsg && <InlineMsg msg={pwdMsg} small />}
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
      ok ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
    }`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function SaveButton({ saving, onClick, label = 'Guardar cambios' }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button" onClick={onClick} disabled={saving}
      className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-6 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {saving ? 'Guardando...' : label}
    </button>
  );
}

function InlineMsg({ msg, small }: { msg: { text: string; ok: boolean }; small?: boolean }) {
  return (
    <p className={`flex items-center gap-1 ${small ? 'mt-2 text-xs' : 'text-sm'} ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>
      {msg.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {msg.text}
    </p>
  );
}
