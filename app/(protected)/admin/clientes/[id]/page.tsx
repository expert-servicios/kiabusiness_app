'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Calendar, CheckCheck, CreditCard,
  Edit2, ExternalLink, FileText, FolderOpen, Mail, MessageCircle,
  Phone, RefreshCw, Save, User, X, Zap,
  Clock, Download, Activity,
} from 'lucide-react';
import { WaTemplateModal } from '@/components/admin/WaTemplateModal';
import type { TimelineEvent } from '@/app/api/admin/clientes/[id]/timeline/route';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  status: string;
  created_at: string;
  stripe_customer_id: string | null;
  profile_completed: boolean;
  billing_ready: boolean;
  habitual_address_ready: boolean;
  active_company_id: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
}

interface Case { id: string; service: string; category: string; state: string; opened_at: string; closed_at: string | null; admin_note: string | null }
interface Sub  { id: string; plan: string; status: string; current_period_end: string | null; stripe_subscription_id: string | null; stripe_customer_id: string | null; stripe_price_id: string | null; company_id: string | null }
interface Quote { id: string; service: string; status: string; amount_eur: number; created_at: string }
interface Order { id: string; amount_eur: number; currency: string; status: string; stripe_payment_id: string | null; holded_invoice_id: string | null; holded_sync_error: string | null; source: string | null; service_slugs: string | null; metadata: Record<string, unknown> | null; created_at: string; company_id: string | null }
interface WaMsg { id: string; direction: 'inbound' | 'outbound'; body: string; created_at: string; needs_review: boolean; ai_responded: boolean; media_type: string | null }
interface Company { id: string; role: string; name: string; razon_social: string | null; nif: string | null; address: string | null; phone: string | null; email: string | null; status: string | null; stripe_customer_id: string | null }
interface Integration { id: string; client_id: string | null; company_id: string | null; provider: string; mode: string; api_version: string | null; api_key_last4: string | null; permissions_detected: Record<string, boolean>; status: string; sync_mode: string; last_sync_at: string | null; last_success_at: string | null; last_error: string | null; created_at: string }
interface Mapping { id: string; provider: string; local_entity: string; local_id: string; external_entity: string; external_id: string; company_id: string | null; updated_at: string }
interface SyncEvent { id: string; provider: string; direction: string; operation: string; local_entity: string | null; local_id: string | null; external_entity: string | null; external_id: string | null; status: string; error: string | null; created_at: string; company_id: string | null; client_id: string | null }

interface ClientData {
  profile:   Profile;
  cases:     Case[];
  subs:      Sub[];
  quotes:    Quote[];
  orders:    Order[];
  messages:  WaMsg[];
  companies: Company[];
  integrations: Integration[];
  mappings: Mapping[];
  syncEvents: SyncEvent[];
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

function Pill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ok ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

function ExternalId({ value }: { value: string | null }) {
  return value
    ? <span className="break-all font-mono text-[11px] text-[#29384a]">{value}</span>
    : <span className="text-xs text-[#9ca3af]">—</span>;
}

export default function ClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    status: 'active',
    stripe_customer_id: '',
    tax_id: '',
    address: '',
    city: '',
    postal_code: '',
    province: '',
    profile_completed: false,
    billing_ready: false,
    habitual_address_ready: false,
    active_company_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [showWa, setShowWa] = useState(false);
  const [integrationBusy, setIntegrationBusy] = useState<string | null>(null);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'timeline' | 'documentos'>('resumen');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; service: string; state: string; docs: { id: string; original_name: string; state: string; downloadUrl: string | null; created_at: string }[] }[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/admin/clientes/${id}/timeline`);
      if (res.ok) { const d = await res.json(); setTimeline(d.events ?? []); }
    } finally { setTimelineLoading(false); }
  }, [id]);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const res = await fetch(`/api/admin/clientes/${id}/timeline`, { method: 'POST' });
      if (res.ok) { const d = await res.json(); setDocuments(d.byCase ?? []); }
    } finally { setDocumentsLoading(false); }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'timeline' && timeline.length === 0 && !timelineLoading) loadTimeline(); // eslint-disable-line react-hooks/set-state-in-effect
    if (activeTab === 'documentos' && documents.length === 0 && !documentsLoading) loadDocuments();
  }, [activeTab, timeline.length, documents.length, timelineLoading, documentsLoading, loadTimeline, loadDocuments]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clientes/${id}`);
      if (!res.ok) { setError('Cliente no encontrado'); return; }
      const json: ClientData = await res.json();
      setData(json);
      setEditForm({
        full_name:       json.profile.full_name ?? '',
        email:           json.profile.email ?? '',
        phone:           json.profile.phone ?? '',
        whatsapp_number: json.profile.whatsapp_number ?? '',
        status:          json.profile.status ?? 'active',
        stripe_customer_id: json.profile.stripe_customer_id ?? '',
        tax_id:          json.profile.tax_id ?? '',
        address:         json.profile.address ?? '',
        city:            json.profile.city ?? '',
        postal_code:     json.profile.postal_code ?? '',
        province:        json.profile.province ?? '',
        profile_completed: Boolean(json.profile.profile_completed),
        billing_ready: Boolean(json.profile.billing_ready),
        habitual_address_ready: Boolean(json.profile.habitual_address_ready),
        active_company_id: json.profile.active_company_id ?? '',
      });
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        active_company_id: editForm.active_company_id || null,
        stripe_customer_id: editForm.stripe_customer_id || null,
        tax_id: editForm.tax_id || null,
        address: editForm.address || null,
        city: editForm.city || null,
        postal_code: editForm.postal_code || null,
        province: editForm.province || null,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setData((d) => d ? { ...d, profile: { ...d.profile, ...json.profile } } : d);
      setEditing(false);
    }
    setSaving(false);
  };

  const updateHoldedIntegration = async (
    integrationId: string,
    payload?: { status?: string; sync_mode?: string },
    method: 'PATCH' | 'DELETE' = 'PATCH',
  ) => {
    setIntegrationBusy(integrationId);
    setIntegrationError(null);
    try {
      const res = await fetch(`/api/admin/clientes/${id}/integrations/${integrationId}`, {
        method,
        headers: method === 'PATCH' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'PATCH' ? JSON.stringify(payload ?? {}) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIntegrationError(json.error ?? 'No se pudo actualizar la integracion');
        return;
      }
      await load();
    } catch {
      setIntegrationError('Error de conexion al actualizar Holded');
    } finally {
      setIntegrationBusy(null);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f4eb]">
      <RefreshCw className="h-6 w-6 animate-spin text-[#c88b25]" />
    </div>
  );
  if (error || !data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f4eb]">
      <p className="text-[#29384a]">{error ?? 'Error desconocido'}</p>
      <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-[#c88b25] underline">Volver</button>
    </div>
  );

  const { profile, cases, subs, quotes, orders, messages, companies, integrations, mappings, syncEvents } = data;
  const activeCases  = cases.filter((c) => c.state !== 'cerrado' && c.state !== 'finalizado');
  const activeSubs   = subs.filter((s) => s.status === 'active' || s.status === 'trialing');
  const activeHolded = integrations.filter((integration) => integration.provider === 'holded' && integration.status === 'active');
  const initials     = (profile.full_name ?? profile.email).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const displayPhone = profile.whatsapp_number ?? profile.phone ?? null;

  return (
    <div className="min-h-screen bg-[#f8f4eb]">

      {/* ── HEADER ── */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-start gap-4">
            <button type="button" title="Volver" onClick={() => router.back()} className="mt-1 rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e8d8]">
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
                <Pill label="Perfil" ok={profile.profile_completed} />
                <Pill label="Facturación" ok={profile.billing_ready} />
                <Pill label="Stripe" ok={Boolean(profile.stripe_customer_id || activeSubs.some((s) => s.stripe_customer_id))} />
                <Pill label="Holded" ok={activeHolded.length > 0} />
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

      {/* ── TABS ── */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-5xl flex gap-1 px-6 pt-2">
          {([
            { id: 'resumen',    label: 'Resumen',    icon: User },
            { id: 'timeline',   label: 'Timeline',   icon: Activity },
            { id: 'documentos', label: 'Documentos', icon: FileText },
          ] as const).map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tabId
                  ? 'border-[#D4A017] text-[#07111d]'
                  : 'border-transparent text-[#29384a]/60 hover:text-[#07111d]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-6 py-6">

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Historial completo</h2>
              <button type="button" onClick={loadTimeline} className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">
                <RefreshCw className={`h-3.5 w-3.5 ${timelineLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
            {timelineLoading ? (
              <div className="flex items-center justify-center py-16"><RefreshCw className="h-5 w-5 animate-spin text-[#d7a33a]" /></div>
            ) : timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="h-10 w-10 text-[#d8cbb5]" />
                <p className="mt-3 text-sm text-[#29384a]">Sin actividad registrada</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-[#d8cbb5]" />
                <div className="space-y-1">
                  {timeline.map((ev) => {
                    const { dot, bg, text, label } = (() => {
                      const m: Record<string, { dot: string; bg: string; text: string; label: string }> = {
                        case:           { dot: 'bg-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Expediente' },
                        whatsapp_in:    { dot: 'bg-green-400',  bg: 'bg-green-50',  text: 'text-green-700',  label: 'WhatsApp ←' },
                        whatsapp_out:   { dot: 'bg-green-600',  bg: 'bg-green-50',  text: 'text-green-800',  label: 'WhatsApp →' },
                        email:          { dot: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Email' },
                        payment:        { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Pago' },
                        quote:          { dot: 'bg-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', label: 'Presupuesto' },
                        appointment:    { dot: 'bg-sky-400',    bg: 'bg-sky-50',    text: 'text-sky-700',    label: 'Cita' },
                        document:       { dot: 'bg-slate-400',  bg: 'bg-slate-50',  text: 'text-slate-700',  label: 'Documento' },
                        subscription:   { dot: 'bg-violet-400', bg: 'bg-violet-50', text: 'text-violet-700', label: 'Suscripción' },
                        note:           { dot: 'bg-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-700',   label: 'Nota' },
                      };
                      return m[ev.type] ?? m.note;
                    })();
                    const dt = new Date(ev.date);
                    return (
                      <div key={ev.id} className="relative flex gap-4">
                        {/* Dot */}
                        <div className={`relative z-10 ml-[14px] mt-3 flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full ring-2 ring-white ${dot}`} />
                        {/* Content */}
                        <div className={`flex-1 rounded-xl border border-[#f0e8d8] px-4 py-3 ${bg}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bg} ${text} border border-current/20`}>{label}</span>
                                {ev.link ? (
                                  <Link href={ev.link} className="truncate text-sm font-semibold text-[#07111d] hover:underline">{ev.title}</Link>
                                ) : (
                                  <p className="truncate text-sm font-semibold text-[#07111d]">{ev.title}</p>
                                )}
                              </div>
                              {ev.detail && <p className="mt-0.5 text-xs text-[#29384a]/70">{ev.detail}</p>}
                            </div>
                            <time className="shrink-0 text-[11px] text-[#29384a]/50">
                              {dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              {' '}
                              {dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </time>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTOS TAB ── */}
        {activeTab === 'documentos' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Documentos</h2>
              <button type="button" onClick={loadDocuments} className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] hover:border-[#c88b25]">
                <RefreshCw className={`h-3.5 w-3.5 ${documentsLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
            {documentsLoading ? (
              <div className="flex items-center justify-center py-16"><RefreshCw className="h-5 w-5 animate-spin text-[#d7a33a]" /></div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-10 w-10 text-[#d8cbb5]" />
                <p className="mt-3 text-sm text-[#29384a]">Sin documentos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((caseGroup) => (
                  <div key={caseGroup.id} className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#f0e8d8] px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-[#c88b25]" />
                        <Link href={`/admin/expedientes/${caseGroup.id}`} className="text-sm font-semibold text-[#07111d] hover:underline">{caseGroup.service}</Link>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATE_COLOR[caseGroup.state] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATE_LABEL[caseGroup.state] ?? caseGroup.state}
                        </span>
                      </div>
                      <span className="text-xs text-[#29384a]/60">{caseGroup.docs.length} doc{caseGroup.docs.length !== 1 ? 's' : ''}</span>
                    </div>
                    {caseGroup.docs.length === 0 ? (
                      <p className="px-5 py-3 text-xs text-[#9ca3af]">Sin documentos en este expediente</p>
                    ) : (
                      <ul className="divide-y divide-[#f8f4eb]">
                        {caseGroup.docs.map((doc) => (
                          <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-[#07111d]">{doc.original_name}</p>
                              <p className="text-[10px] text-[#29384a]/60">{new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${doc.state === 'aprobado' ? 'bg-green-100 text-green-700' : doc.state === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {doc.state}
                              </span>
                              {doc.downloadUrl && (
                                <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer"
                                  title={`Descargar ${doc.original_name}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]">
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESUMEN TAB ── */}
        {activeTab === 'resumen' && <>

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

        <Section title="Stripe / Holded" icon={CreditCard}>
          <div className="grid gap-4 px-5 py-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#f0e8d8] bg-[#faf8f2] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]/60">Stripe</p>
                <Pill label={profile.stripe_customer_id ? 'Customer vinculado' : 'Sin customer'} ok={Boolean(profile.stripe_customer_id)} />
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs font-semibold text-[#29384a]/60">Customer ID perfil</p>
                  <ExternalId value={profile.stripe_customer_id} />
                </div>
                {subs.slice(0, 3).map((sub) => (
                  <div key={sub.id} className="rounded-lg bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#07111d]">{sub.plan}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SUB_COLOR[sub.status] ?? 'bg-gray-100 text-gray-600'}`}>{sub.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#29384a]">Renueva: {fmtDate(sub.current_period_end)}</p>
                    <p className="mt-1 break-all font-mono text-[10px] text-[#29384a]/70">{sub.stripe_subscription_id ?? 'Sin subscription ID'}</p>
                  </div>
                ))}
                {subs.length === 0 && <p className="text-xs text-[#9ca3af]">Sin suscripciones Stripe registradas.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-[#f0e8d8] bg-[#faf8f2] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]/60">Holded</p>
                <Pill label={activeHolded.length ? 'Conectado' : 'No conectado'} ok={activeHolded.length > 0} />
              </div>
              {integrations.length === 0 ? (
                <p className="text-xs text-[#9ca3af]">Sin integración Holded vinculada al cliente o sus empresas.</p>
              ) : (
                <div className="space-y-2">
                  {integrationError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{integrationError}</p>
                  )}
                  {integrations.map((integration) => (
                    <div key={integration.id} className="rounded-lg bg-white px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[#07111d]">{integration.mode === 'expert_account' ? 'Cuenta EXPERT' : 'Cuenta cliente'}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${integration.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{integration.status}</span>
                      </div>
                      {integration.company_id && (
                        <p className="mt-1 text-[#29384a]">
                          Empresa: {companies.find((company) => company.id === integration.company_id)?.name ?? integration.company_id}
                        </p>
                      )}
                      <p className="mt-1 text-[#29384a]">Modo sync: {integration.sync_mode}</p>
                      <p className="mt-1 text-[#29384a]">API: {integration.api_key_last4 ? `••••${integration.api_key_last4}` : 'sin clave visible'}</p>
                      {integration.last_success_at && <p className="mt-1 text-[#29384a]">Último OK: {fmtDate(integration.last_success_at)}</p>}
                      {integration.last_error && <p className="mt-1 text-red-600">Error: {integration.last_error}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={integrationBusy === integration.id}
                          onClick={() => integration.status === 'active'
                            ? updateHoldedIntegration(integration.id, undefined, 'DELETE')
                            : updateHoldedIntegration(integration.id, { status: 'active' })}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
                            integration.status === 'active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {integrationBusy === integration.id ? 'Guardando...' : integration.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          disabled={integrationBusy === integration.id}
                          onClick={() => updateHoldedIntegration(integration.id, {
                            sync_mode: integration.sync_mode === 'read_only' ? 'read_write' : 'read_only',
                          })}
                          className="rounded-lg bg-[#f0e8d8] px-2.5 py-1 text-[11px] font-bold text-[#29384a] transition hover:bg-[#e7d9bd] disabled:opacity-50"
                        >
                          {integration.sync_mode === 'read_only' ? 'Permitir escritura' : 'Solo lectura'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

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

          <Section title="Pedidos / pagos" icon={CreditCard}>
            {orders.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[#29384a]/60">Sin pedidos</p>
            ) : (
              <ul className="divide-y divide-[#f0e8d8]">
                {orders.slice(0, 6).map((order) => (
                  <li key={order.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#07111d]">
                          {order.service_slugs ?? String(order.metadata?.service_title ?? order.source ?? 'Pedido')}
                        </p>
                        <p className="text-xs text-[#29384a]">{fmtDate(order.created_at)}</p>
                        <p className="mt-1 break-all font-mono text-[10px] text-[#29384a]/70">
                          Stripe: {order.stripe_payment_id ?? '—'}
                        </p>
                        <p className="break-all font-mono text-[10px] text-[#29384a]/70">
                          Holded: {order.holded_invoice_id ?? '—'}
                        </p>
                        {order.holded_sync_error && <p className="mt-1 text-xs text-red-600">{order.holded_sync_error}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[#c88b25]">{Number(order.amount_eur).toLocaleString('es-ES')} {order.currency}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
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
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#07111d]">{co.name}</p>
                    {co.nif && <p className="text-xs text-[#29384a]">NIF: {co.nif}</p>}
                    {co.address && <p className="text-xs text-[#29384a]">{co.address}</p>}
                    {co.email && <p className="text-xs text-[#29384a]">{co.email}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${co.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {co.status ?? 'active'}
                    </span>
                    <p className="mt-1 font-mono text-[10px] text-[#29384a]/70">{co.stripe_customer_id ?? 'Sin Stripe company'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Mappings externos" icon={ExternalLink}>
            {mappings.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[#29384a]/60">Sin mappings externos</p>
            ) : (
              <ul className="divide-y divide-[#f0e8d8]">
                {mappings.slice(0, 8).map((mapping) => (
                  <li key={mapping.id} className="px-5 py-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#07111d]">{mapping.provider} · {mapping.local_entity} → {mapping.external_entity}</p>
                        <p className="mt-1 break-all font-mono text-[#29384a]/70">{mapping.external_id}</p>
                      </div>
                      <span className="shrink-0 text-[#29384a]/60">{fmtDate(mapping.updated_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Eventos sync" icon={RefreshCw}>
            {syncEvents.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[#29384a]/60">Sin eventos de sincronización</p>
            ) : (
              <ul className="divide-y divide-[#f0e8d8]">
                {syncEvents.slice(0, 8).map((event) => (
                  <li key={event.id} className="px-5 py-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#07111d]">{event.provider} · {event.operation}</p>
                        <p className="mt-1 text-[#29384a]">{event.direction} · {event.local_entity ?? 'local'} → {event.external_entity ?? 'external'}</p>
                        {event.error && <p className="mt-1 text-red-600">{event.error}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${event.status === 'success' ? 'bg-green-100 text-green-800' : event.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {event.status}
                        </span>
                        <p className="mt-1 text-[#29384a]/60">{fmtDate(event.created_at)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

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

        </> /* end resumen tab */}
      </div>

      {/* ── EDIT MODAL ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Editar cliente</h2>
              <button type="button" title="Cerrar" onClick={() => setEditing(false)} className="rounded-lg p-1 hover:bg-[#f0e8d8]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {([
                { key: 'full_name',       label: 'Nombre completo', type: 'text' },
                { key: 'email',           label: 'Email',           type: 'email' },
                { key: 'phone',           label: 'Teléfono',        type: 'tel' },
                { key: 'whatsapp_number', label: 'WhatsApp',        type: 'tel' },
                { key: 'tax_id',          label: 'DNI / NIE / CIF', type: 'text' },
                { key: 'address',         label: 'Dirección fiscal', type: 'text' },
                { key: 'city',            label: 'Ciudad',          type: 'text' },
                { key: 'postal_code',     label: 'Código postal',   type: 'text' },
                { key: 'province',        label: 'Provincia',       type: 'text' },
                { key: 'stripe_customer_id', label: 'Stripe customer ID', type: 'text' },
              ] as const).map(({ key, label, type }) => (
                <div key={key}>
                  <label htmlFor={`edit-${key}`} className="mb-1 block text-xs font-semibold text-[#07111d]">{label}</label>
                  <input
                    id={`edit-${key}`}
                    type={type}
                    title={label}
                    placeholder={label}
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#07111d]">Empresa activa</label>
                <select
                  aria-label="Empresa activa"
                  id="edit-active_company_id"
                  value={editForm.active_company_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, active_company_id: e.target.value }))}
                  className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                >
                  <option value="">Sin empresa activa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#07111d]">Estado</label>
                <select
                  aria-label="Estado del cliente"
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  ['profile_completed', 'Perfil completo'],
                  ['billing_ready', 'Facturación lista'],
                  ['habitual_address_ready', 'Domicilio habitual'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a]">
                    <input
                      type="checkbox"
                      checked={editForm[key]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
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
