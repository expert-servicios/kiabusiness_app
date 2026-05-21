'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Calendar, CheckCheck, CreditCard,
  Edit2, ExternalLink, FileText, FolderOpen, Mail, MessageCircle,
  Phone, RefreshCw, Save, User, X, Zap
} from 'lucide-react';
import { WaTemplateModal } from '@/components/admin/WaTemplateModal';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  status: string;
  created_at: string;
}

interface Case { id: string; service: string; category: string; state: string; opened_at: string; closed_at: string | null; admin_note: string | null }
interface Sub  { id: string; plan: string; status: string; current_period_end: string | null; stripe_subscription_id: string | null }
interface Quote { id: string; service: string; status: string; amount_eur: number; created_at: string }
interface WaMsg { id: string; direction: 'inbound' | 'outbound'; body: string; created_at: string; needs_review: boolean; ai_responded: boolean; media_type: string | null }
interface Company { id: string; name: string; nif: string | null; address: string | null }

interface ClientData {
  profile:   Profile;
  cases:     Case[];
  subs:      Sub[];
  quotes:    Quote[];
  messages:  WaMsg[];
  companies: Company[];
}

const STATE_LABEL: Record<string, string> = {
  pendiente_documentacion: 'Pendiente docs',
  en_revision:             'En revisión',
  en_proceso:              'En proceso',
  presentado:              'Presentado',
  finalizado:              'Finalizado',
  cerrado:                 'Cerrado',
};
const STATE_COLOR: Record<string, string> = {
  pendiente_documentacion: 'bg-amber-100 text-amber-800',
  en_revision:             'bg-blue-100 text-blue-800',
  en_proceso:              'bg-purple-100 text-purple-800',
  presentado:              'bg-green-100 text-green-800',
  finalizado:              'bg-gray-100 text-gray-600',
  cerrado:                 'bg-gray-100 text-gray-500',
};
const SUB_COLOR: Record<string, string> = {
  active:   'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-600',
};
const QUOTE_COLOR: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};
const QUOTE_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado', rejected: 'Rechazado'
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  const dt = new Date(d);
  const now = new Date();
  const diff = now.getTime() - dt.getTime();
  if (diff < 86400000 && dt.toDateString() === now.toDateString())
    return `${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
  return `${dt.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][dt.getMonth()]}`;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#f0e8d8] px-5 py-4">
        <Icon className="h-4 w-4 text-[#c88b25]" />
        <h2 className="font-serif text-base font-bold text-[#07111d]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function ClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', whatsapp_number: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [showWa, setShowWa] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clientes/${id}`);
      if (!res.ok) { setError('Cliente no encontrado'); return; }
      const json: ClientData = await res.json();
      setData(json);
      setEditForm({
        full_name:       json.profile.full_name ?? '',
        phone:           json.profile.phone ?? '',
        whatsapp_number: json.profile.whatsapp_number ?? '',
        status:          json.profile.status ?? 'active',
      });
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const json = await res.json();
      setData((d) => d ? { ...d, profile: { ...d.profile, ...json.profile } } : d);
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f4eb]">
      <RefreshCw className="h-6 w-6 animate-spin text-[#c88b25]" />
    </div>
  );
  if (error || !data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f4eb]">
      <p className="text-[#29384a]">{error ?? 'Error desconocido'}</p>
      <button onClick={() => router.back()} className="text-sm font-semibold text-[#c88b25] underline">Volver</button>
    </div>
  );

  const { profile, cases, subs, quotes, messages, companies } = data;
  const activeCases  = cases.filter((c) => c.state !== 'cerrado' && c.state !== 'finalizado');
  const activeSubs   = subs.filter((s) => s.status === 'active' || s.status === 'trialing');
  const initials     = (profile.full_name ?? profile.email).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const displayPhone = profile.whatsapp_number ?? profile.phone ?? null;

  return (
    <div className="min-h-screen bg-[#f8f4eb]">

      {/* ── HEADER ── */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-start gap-4">
            <button type="button" onClick={() => router.back()} className="mt-1 rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e8d8]">
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#07111d] text-lg font-bold text-[#D4A017]">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-[#07111d]">
                  {profile.full_name ?? 'Sin nombre'}
                </h1>
                {activeSubs.length > 0 && (
                  <span className="rounded-full bg-[#c88b25]/15 px-2.5 py-0.5 text-xs font-bold text-[#c88b25]">
                    {activeSubs[0].plan}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {profile.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#29384a]">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                {profile.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Alta: {fmtDate(profile.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap gap-2">
              {displayPhone && (
                <button
                  type="button"
                  onClick={() => setShowWa(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1da851]"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
              >
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </button>
              <Link
                href={`/admin/expedientes?clientId=${profile.id}`}
                className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
              >
                <FolderOpen className="h-3.5 w-3.5" /> Expedientes
              </Link>
              <a
                href={`/dashboard?viewAs=${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Ver portal
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-6 py-6">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Expedientes activos', value: activeCases.length, icon: FolderOpen, href: `/admin/expedientes?clientId=${profile.id}` },
            { label: 'Total expedientes',   value: cases.length,       icon: FileText,   href: `/admin/expedientes?clientId=${profile.id}` },
            { label: 'Suscripciones',        value: activeSubs.length,  icon: Zap,        href: '/admin/suscripciones' },
            { label: 'Presupuestos',         value: quotes.length,      icon: CreditCard, href: '/admin/presupuestos' },
          ].map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href} className="group rounded-2xl border border-[#d8cbb5] bg-white p-4 shadow-sm transition hover:border-[#c88b25]">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-[#c88b25]" />
                <p className="font-serif text-2xl font-bold text-[#07111d]">{value}</p>
              </div>
              <p className="mt-2 text-xs font-semibold text-[#29384a]">{label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">

          {/* ── EXPEDIENTES ── */}
          <Section title="Expedientes" icon={FolderOpen}>
            {cases.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[#29384a]/60">Sin expedientes</p>
            ) : (
              <ul className="divide-y divide-[#f0e8d8]">
                {cases.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/expedientes/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-[#faf8f2]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#07111d]">{c.service}</p>
                        <p className="text-xs text-[#29384a]">{fmtDate(c.opened_at)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATE_COLOR[c.state] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATE_LABEL[c.state] ?? c.state}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── PRESUPUESTOS ── */}
          <Section title="Presupuestos" icon={FileText}>
            {quotes.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[#29384a]/60">Sin presupuestos</p>
            ) : (
              <ul className="divide-y divide-[#f0e8d8]">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/admin/presupuestos/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-[#faf8f2]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#07111d]">{q.service || '—'}</p>
                        <p className="text-xs text-[#29384a]">{fmtDate(q.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {q.amount_eur > 0 && (
                          <span className="text-sm font-bold text-[#c88b25]">€{q.amount_eur.toLocaleString('es-ES')}</span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${QUOTE_COLOR[q.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {QUOTE_LABEL[q.status] ?? q.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── SUSCRIPCIONES ── */}
          <Section title="Suscripciones" icon={Zap}>
            {subs.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[#29384a]/60">Sin suscripciones</p>
            ) : (
              <ul className="divide-y divide-[#f0e8d8]">
                {subs.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold capitalize text-[#07111d]">{s.plan}</p>
                      {s.current_period_end && (
                        <p className="text-xs text-[#29384a]">Renueva: {fmtDate(s.current_period_end)}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SUB_COLOR[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── ÚLTIMOS MENSAJES WHATSAPP ── */}
          <Section title="WhatsApp reciente" icon={MessageCircle}>
            {messages.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[#29384a]/60">Sin mensajes</p>
            ) : (
              <>
                <ul className="divide-y divide-[#f0e8d8]">
                  {messages.map((m) => (
                    <li key={m.id} className={`px-5 py-3 ${m.needs_review ? 'bg-red-50' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-xs ${m.direction === 'outbound' ? 'text-[#29384a]' : 'font-semibold text-[#07111d]'}`}>
                            {m.direction === 'inbound' ? '← ' : '→ '}
                            {m.body || (m.media_type ? `[${m.media_type}]` : '—')}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-[10px] text-[#29384a]/60">
                          {m.direction === 'outbound' && <CheckCheck className="h-3 w-3 text-[#25D366]" />}
                          <span>{fmtTime(m.created_at)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#f0e8d8] px-5 py-3">
                  <Link href="/admin/whatsapp" className="text-xs font-semibold text-[#c88b25] hover:text-[#d7a33a]">
                    Ver conversación completa →
                  </Link>
                </div>
              </>
            )}
          </Section>
        </div>

        {/* ── EMPRESAS ── */}
        {companies.length > 0 && (
          <Section title="Empresa / Datos fiscales" icon={Building2}>
            <ul className="divide-y divide-[#f0e8d8]">
              {companies.map((co) => (
                <li key={co.id} className="flex items-center gap-4 px-5 py-4">
                  <Building2 className="h-4 w-4 shrink-0 text-[#c88b25]" />
                  <div>
                    <p className="text-sm font-semibold text-[#07111d]">{co.name}</p>
                    {co.nif && <p className="text-xs text-[#29384a]">NIF: {co.nif}</p>}
                    {co.address && <p className="text-xs text-[#29384a]">{co.address}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── INFO CUENTA ── */}
        <Section title="Cuenta" icon={User}>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]/60">ID usuario</p>
              <p className="mt-1 break-all font-mono text-xs text-[#29384a]">{profile.id}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]/60">Email</p>
              <p className="mt-1 text-sm text-[#07111d]">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]/60">Teléfono</p>
              <p className="mt-1 text-sm text-[#07111d]">{profile.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]/60">WhatsApp</p>
              <p className="mt-1 text-sm text-[#07111d]">{profile.whatsapp_number ?? '—'}</p>
            </div>
          </div>
        </Section>

      </div>

      {/* ── EDIT MODAL ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Editar cliente</h2>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg p-1 hover:bg-[#f0e8d8]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {([
                { key: 'full_name',       label: 'Nombre completo', type: 'text' },
                { key: 'phone',           label: 'Teléfono',        type: 'tel' },
                { key: 'whatsapp_number', label: 'WhatsApp',        type: 'tel' },
              ] as const).map(({ key, label, type }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-[#07111d]">{label}</label>
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#07111d]">Estado</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#07111d] py-3 text-sm font-bold text-[#D4A017] transition hover:bg-[#0d1f35] disabled:opacity-60"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* ── WHATSAPP MODAL ── */}
      {showWa && displayPhone && (
        <WaTemplateModal
          defaultPhone={displayPhone}
          onClose={() => setShowWa(false)}
          onSent={() => setShowWa(false)}
        />
      )}
    </div>
  );
}
