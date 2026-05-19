'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Save, CheckCircle2, MessageCircle, KeyRound, Mail, AlertCircle } from 'lucide-react';

interface Props {
  email: string;
  role: string;
  initialFullName: string;
  initialPhone: string;
  initialWhatsappNumber: string;
  initialWhatsappConsent: boolean;
  hasEmailPassword: boolean;
}

export function ProfileForm({
  email,
  initialFullName,
  initialPhone,
  initialWhatsappNumber,
  initialWhatsappConsent,
  hasEmailPassword
}: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);
  const [whatsappConsent, setWhatsappConsent] = useState(initialWhatsappConsent);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // Change password
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [sendingPwd, setSendingPwd] = useState(false);

  const getSupabase = () =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, whatsapp_number: whatsappNumber, whatsapp_consent: whatsappConsent })
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg({ text: data.error ?? 'Error al guardar', ok: false }); return; }
      setSaveMsg({ text: 'Perfil actualizado correctamente.', ok: true });
    } catch {
      setSaveMsg({ text: 'Error de conexión.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === email) return;
    setSavingEmail(true);
    setEmailMsg(null);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/dashboard/perfil` }
      );
      if (error) { setEmailMsg({ text: error.message, ok: false }); return; }
      setEmailMsg({ text: 'Confirmación enviada a ambas direcciones. Revisa tu correo.', ok: true });
      setNewEmail('');
    } catch {
      setEmailMsg({ text: 'Error al cambiar el email.', ok: false });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setSendingPwd(true);
    setPwdMsg(null);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) { setPwdMsg({ text: error.message, ok: false }); return; }
      setPwdMsg({ text: 'Enlace de cambio de contraseña enviado a tu correo.', ok: true });
    } catch {
      setPwdMsg({ text: 'Error al enviar el enlace.', ok: false });
    } finally {
      setSendingPwd(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Personal data */}
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
        <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Datos personales</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre y apellidos"
              className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 6XX XXX XXX"
              className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="mt-5 rounded-2xl border border-[#d8cbb5] bg-[#f8f4eb] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#07111d]">
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            WhatsApp
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Número de WhatsApp</label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+34 6XX XXX XXX"
              className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#d8cbb5] text-[#c88b25]"
            />
            <span className="text-xs text-[#29384a] leading-relaxed">
              Acepto recibir notificaciones del estado de mi expediente por WhatsApp.
            </span>
          </label>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-6 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saveMsg && (
            <p className={`flex items-center gap-1 text-sm ${saveMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
              {saveMsg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {saveMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Change email */}
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
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nuevo@correo.com"
            className="flex-1 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
          />
          <button
            type="button"
            onClick={handleChangeEmail}
            disabled={savingEmail || !newEmail || newEmail === email}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#07111d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2d40] disabled:opacity-50"
          >
            {savingEmail ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
        {emailMsg && (
          <p className={`mt-2 flex items-center gap-1 text-xs ${emailMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
            {emailMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {emailMsg.text}
          </p>
        )}
        <p className="mt-2 text-[10px] text-[#29384a]">
          Se enviará un enlace de confirmación a ambas direcciones.
        </p>
      </div>

      {/* Change password */}
      {hasEmailPassword && (
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Contraseña</p>
          </div>
          <p className="mb-4 text-xs text-[#29384a]">
            Recibirás un enlace en tu correo para establecer una nueva contraseña.
          </p>
          <button
            type="button"
            onClick={handleSendPasswordReset}
            disabled={sendingPwd}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-50"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {sendingPwd ? 'Enviando...' : 'Enviar enlace para cambiar contraseña'}
          </button>
          {pwdMsg && (
            <p className={`mt-2 flex items-center gap-1 text-xs ${pwdMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
              {pwdMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {pwdMsg.text}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
