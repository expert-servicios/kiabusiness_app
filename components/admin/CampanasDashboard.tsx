'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Plus, Send, Sparkles, RefreshCw, Trash2, Edit2,
  Users, CheckCircle2, XCircle, Clock, ChevronDown,
  Eye, X, Loader2, Megaphone, Rss, ExternalLink, ShieldCheck, Copy,
} from 'lucide-react';
import { julyEmailCampaignDrafts, julyMetricoolLinks } from '@/lib/marketing/july-2026';

type SegmentKey = 'all_active' | 'subscribers' | 'no_subscription' | 'leads' | 'all' | 'newsletter';
type CampaignStatus = 'draft' | 'sending' | 'sent' | 'archived';
type Tone = 'profesional' | 'cercano' | 'urgente' | 'informativo';

interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  subject: string;
  segment: SegmentKey;
  recipient_count: number | null;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

interface MetricoolStatus {
  ok: boolean;
  configured: boolean;
  connected: boolean;
  blogId?: string;
  userId?: string;
  usesLegacyTokenName?: boolean;
  feedUrl: string;
  rssUrl: string;
  missing?: string[];
  profiles?: unknown[];
  error?: string;
  detail?: string;
  status?: number;
}

const SEGMENT_LABELS: Record<SegmentKey, string> = {
  all_active:      'Todos los clientes activos',
  subscribers:     'Suscriptores activos',
  no_subscription: 'Clientes sin suscripción',
  leads:           'Leads no convertidos',
  all:             'Todos (activos + inactivos)',
  newsletter:      'Newsletter',
};

const TONE_LABELS: Record<Tone, string> = {
  profesional: 'Profesional (usted)',
  cercano:     'Cercano (tú)',
  urgente:     'Urgente',
  informativo: 'Informativo',
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  if (status === 'sent')    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"><CheckCircle2 className="h-3 w-3"/>Enviada</span>;
  if (status === 'sending') return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700"><Loader2 className="h-3 w-3 animate-spin"/>Enviando</span>;
  if (status === 'archived') return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500"><XCircle className="h-3 w-3"/>Archivada</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Clock className="h-3 w-3"/>Borrador</span>;
}

function MetricoolConnectionCard() {
  const [status, setStatus] = useState<MetricoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metricool/status', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        ok: false,
        configured: false,
        connected: false,
        feedUrl: 'https://expertconsulting.es/feed',
        rssUrl: 'https://expertconsulting.es/rss',
        error: 'No se pudo comprobar Metricool',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const feedUrl = status?.feedUrl ?? 'https://expertconsulting.es/feed';
  const copyFeed = async () => {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            status?.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {status?.connected ? <ShieldCheck className="h-5 w-5" /> : <Rss className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[#07111d]">Metricool + Blog</h3>
              {loading ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f8f4eb] px-2 py-0.5 text-[10px] font-semibold text-[#29384a]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Comprobando
                </span>
              ) : status?.connected ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Conectado</span>
              ) : status?.configured ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Revisar API</span>
              ) : (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Sin configurar</span>
              )}
            </div>
            <p className="mt-1 text-xs text-[#29384a]">
              RSS: <span className="font-mono">{feedUrl}</span>
              {status?.blogId ? <span> · Blog ID {status.blogId}</span> : null}
            </p>
            {status?.usesLegacyTokenName && (
              <p className="mt-1 text-[10px] text-amber-700">Usando fallback Metricol_API; recomendado METRICOOL_USER_TOKEN.</p>
            )}
            {status && !status.connected && (
              <p className="mt-1 text-[10px] text-red-600">
                {status.missing?.length ? `Faltan: ${status.missing.join(', ')}` : status.error ?? status.detail ?? 'No conectado'}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Feed
          </a>
          <button
            type="button"
            onClick={copyFeed}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copiado' : 'Copiar RSS'}
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8cbb5] bg-white text-[#29384a] transition hover:border-[#c88b25] disabled:opacity-50"
            title="Comprobar Metricool"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function JulyCampaignActions({
  campaignTitles,
  onCreated,
}: {
  campaignTitles: string[];
  onCreated: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existing = new Set(campaignTitles);
  const missingDrafts = julyEmailCampaignDrafts.filter((draft) => !existing.has(draft.title));

  const copyMetricoolLinks = async () => {
    const text = Object.entries(julyMetricoolLinks)
      .map(([key, url]) => `${key}: ${url}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const createDrafts = async () => {
    setCreating(true);
    setMessage(null);
    setError(null);
    try {
      let created = 0;
      for (const draft of missingDrafts) {
        const res = await fetch('/api/admin/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: draft.title,
            subject: draft.subject,
            body_html: draft.bodyHtml,
            segment: draft.segment,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `No se pudo crear ${draft.title}`);
        }
        created++;
      }
      setMessage(created ? `${created} borradores de julio creados.` : 'Los borradores de julio ya existen.');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron crear los borradores.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[#07111d]">P0 julio 2026</p>
            <span className="rounded-full bg-[#f8f4eb] px-2 py-0.5 text-[10px] font-semibold text-[#29384a]">
              {julyEmailCampaignDrafts.length - missingDrafts.length}/{julyEmailCampaignDrafts.length} borradores
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#29384a]">
            Crea los emails base de julio y copia los enlaces UTM de Metricool para Holded, planes mensuales y certificado digital.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(julyMetricoolLinks).map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-[11px] font-semibold text-[#29384a] transition hover:border-[#c88b25]"
              >
                {key}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
          {message && <p className="mt-2 text-xs font-semibold text-emerald-700">{message}</p>}
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={copyMetricoolLinks}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copiado' : 'Copiar UTMs'}
          </button>
          <button
            type="button"
            onClick={createDrafts}
            disabled={creating || missingDrafts.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#07111d] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1a2a3a] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {missingDrafts.length ? `Crear ${missingDrafts.length} borradores` : 'Borradores listos'}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ── Campaign editor modal ──────────────────────────────────────────────────────
function CampaignEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Campaign;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle]       = useState(initial?.title ?? '');
  const [subject, setSubject]   = useState(initial?.subject ?? '');
  const [bodyHtml, setBodyHtml] = useState('');
  const [segment, setSegment]   = useState<SegmentKey>(initial?.segment ?? 'all_active');
  const [topic, setTopic]       = useState('');
  const [tone, setTone]         = useState<Tone>('cercano');
  const [extraCtx, setExtraCtx] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(initial?.recipient_count ?? null);
  const [previewSample, setPreviewSample] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [kiaLoading, setKiaLoading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const loadSegmentCount = useCallback(async (seg: SegmentKey) => {
    setCountLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/segment-preview?segment=${seg}`);
      if (res.ok) {
        const d = await res.json();
        setRecipientCount(d.count);
        setPreviewSample(d.sample ?? []);
      }
    } finally { setCountLoading(false); }
  }, []);

  useEffect(() => { loadSegmentCount(segment); }, [segment, loadSegmentCount]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleKiaDraft = async () => {
    if (!topic) { setError('Escribe el tema de la campaña primero.'); return; }
    setKiaLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/campaigns/kia-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, audience: SEGMENT_LABELS[segment], tone, extraContext: extraCtx }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.subject && !subject) setSubject(d.subject);
        if (d.html) setBodyHtml(d.html);
      }
    } catch { setError('Error al contactar con Kia.'); }
    finally { setKiaLoading(false); }
  };

  const handleSave = async () => {
    if (!title || !subject || !bodyHtml) { setError('Título, asunto y contenido son obligatorios.'); return; }
    setSaving(true); setError(null);
    try {
      const method = initial ? 'PATCH' : 'POST';
      const url = initial ? `/api/admin/campaigns/${initial.id}` : '/api/admin/campaigns';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject, body_html: bodyHtml, segment }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return; }
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 py-8 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-6 py-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-[#c88b25]"/>
            <p className="font-semibold text-[#07111d]">{initial ? 'Editar campaña' : 'Nueva campaña'}</p>
          </div>
          <button type="button" onClick={onClose}><X className="h-4 w-4 text-[#29384a]"/></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre interno de la campaña *"
              className="col-span-2 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto del email *"
              className="col-span-2 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
          </div>

          {/* Segment */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#29384a]">Destinatarios</label>
            <div className="flex items-center gap-2">
              <select value={segment} onChange={(e) => setSegment(e.target.value as SegmentKey)}
                className="flex-1 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]">
                {Object.entries(SEGMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <div className={`flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-3 py-2.5 text-xs font-semibold ${
                countLoading ? 'text-[#9ca3af]' : 'text-[#07111d]'
              }`}>
                <Users className="h-3.5 w-3.5"/>
                {countLoading ? '...' : (recipientCount ?? '?')}
              </div>
            </div>
            {previewSample.length > 0 && (
              <p className="mt-1.5 text-[10px] text-[#9ca3af]">Ej: {previewSample.join(', ')}</p>
            )}
          </div>

          {/* Kia draft */}
          <div className="rounded-xl border border-[#c88b25]/30 bg-[#c88b25]/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#c88b25]"/>
              <p className="text-xs font-bold text-[#c88b25]">Kia redacta tu campaña</p>
            </div>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Tema de la campaña (p.ej: 'oferta de verano', 'novedad declaración renta', 'recordatorio renovación')..."
              className="w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
            <div className="flex flex-wrap items-center gap-2">
              <select value={tone} onChange={(e) => setTone(e.target.value as Tone)}
                className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c88b25]">
                {Object.entries(TONE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input value={extraCtx} onChange={(e) => setExtraCtx(e.target.value)}
                placeholder="Contexto extra (opcional)..."
                className="flex-1 min-w-[160px] rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c88b25]"/>
              <button type="button" onClick={handleKiaDraft} disabled={kiaLoading || !topic}
                className="flex items-center gap-1.5 rounded-xl bg-[#c88b25] px-4 py-2 text-sm font-bold text-white hover:bg-[#b07820] disabled:opacity-50">
                {kiaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Sparkles className="h-3.5 w-3.5"/>}
                {kiaLoading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>

          {/* Body HTML editor */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-[#29384a]">Contenido HTML del email</label>
              {bodyHtml && (
                <button type="button" onClick={() => setShowPreview((v) => !v)}
                  className="flex items-center gap-1 text-xs text-[#c88b25] hover:underline">
                  <Eye className="h-3.5 w-3.5"/>
                  {showPreview ? 'Ocultar preview' : 'Preview'}
                </button>
              )}
            </div>
            <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<p>Hola {{name}},</p><p>...</p>"
              rows={8}
              className="w-full resize-y rounded-xl border border-[#d8cbb5] px-4 py-3 font-mono text-xs outline-none focus:border-[#c88b25]"/>
            {showPreview && bodyHtml && (
              <div className="mt-2 overflow-hidden rounded-xl border border-[#d8cbb5] bg-white">
                <div className="border-b border-[#f0e9d8] px-4 py-2 text-xs text-[#29384a]">Preview</div>
                <iframe
                  title="Preview HTML de campana"
                  srcDoc={bodyHtml}
                  sandbox="allow-popups"
                  referrerPolicy="no-referrer"
                  className="h-64 w-full bg-white"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-[#f0e9d8]">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm font-semibold text-[#29384a] hover:bg-[#f0e9d8]">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2 text-sm font-bold text-white hover:bg-[#1a2a3a] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>}
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Send confirmation modal ────────────────────────────────────────────────────
function SendConfirmModal({
  campaign,
  onClose,
  onSent,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSent: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sentCount: number; failedCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setSending(true); setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/send`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Error'); return; }
      setResult(d);
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {result ? (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-50 p-4">
                <CheckCircle2 className="h-8 w-8 text-green-600"/>
              </div>
            </div>
            <p className="text-center font-semibold text-[#07111d]">Campaña enviada</p>
            <p className="mt-1 text-center text-sm text-[#29384a]">
              {result.sentCount} enviados · {result.failedCount} fallidos
            </p>
            <button type="button" onClick={() => { onSent(); onClose(); }}
              className="mt-4 w-full rounded-xl bg-[#07111d] py-2.5 text-sm font-bold text-white hover:bg-[#1a2a3a]">
              Cerrar
            </button>
          </>
        ) : (
          <>
            <p className="font-semibold text-[#07111d]">¿Enviar campaña?</p>
            <p className="mt-1 text-sm text-[#29384a]">
              <strong>&quot;{campaign.title}&quot;</strong> se enviará a{' '}
              <strong>{campaign.recipient_count ?? '?'} destinatarios</strong> ({SEGMENT_LABELS[campaign.segment]}).
            </p>
            <p className="mt-2 text-xs text-[#9ca3af]">Esta acción no se puede deshacer.</p>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-[#d8cbb5] py-2.5 text-sm font-semibold text-[#29384a] hover:bg-[#f0e9d8]">
                Cancelar
              </button>
              <button type="button" onClick={handleSend} disabled={sending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#07111d] py-2.5 text-sm font-bold text-white hover:bg-[#1a2a3a] disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                {sending ? 'Enviando...' : 'Enviar ahora'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export function CampanasDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | undefined>();
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/campaigns');
      if (res.ok) { const d = await res.json(); setCampaigns(d.campaigns ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este borrador?')) return;
    await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
    load();
  };

  const sentCampaigns = campaigns.filter((c) => c.status === 'sent');
  const totalSent = sentCampaigns.reduce((s, c) => s + c.sent_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#07111d]">Campañas de email</h2>
          <p className="text-sm text-[#29384a]">
            {sentCampaigns.length} campañas enviadas · {totalSent.toLocaleString()} emails
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8cbb5] bg-white text-[#29384a] hover:border-[#c88b25]">
            <RefreshCw className="h-4 w-4"/>
          </button>
          <button type="button" onClick={() => { setEditTarget(undefined); setShowEditor(true); }}
            className="flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white hover:bg-[#1a2a3a]">
            <Plus className="h-4 w-4"/> Nueva campaña
          </button>
        </div>
      </div>

      <MetricoolConnectionCard />
      <JulyCampaignActions campaignTitles={campaigns.map((campaign) => campaign.title)} onCreated={load} />

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#d7a33a]"/></div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8cbb5] bg-white py-16 text-center">
          <Megaphone className="mb-3 h-10 w-10 text-[#d8cbb5]"/>
          <p className="font-semibold text-[#29384a]">Sin campañas todavía</p>
          <p className="mt-1 text-xs text-[#9ca3af]">Crea tu primera campaña con Kia como redactor.</p>
          <button type="button" onClick={() => { setEditTarget(undefined); setShowEditor(true); }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1a2a3a]">
            <Plus className="h-4 w-4"/> Nueva campaña
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#29384a]">
                <th className="w-8 px-3 py-3"/>
                <th className="px-4 py-3">Campaña</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3 text-center">Dest.</th>
                <th className="px-4 py-3 text-center">Enviados</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <>
                  <tr key={c.id} className="border-b border-[#f8f4eb] hover:bg-[#faf7f0] cursor-pointer"
                    onClick={() => setExpanded((e) => e === c.id ? null : c.id)}>
                    <td className="px-3 py-3 text-[#29384a]">
                      {expanded === c.id ? <ChevronDown className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5 -rotate-90"/>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#07111d]">{c.title}</p>
                      <p className="truncate max-w-[200px] text-xs text-[#29384a]/60">{c.subject}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#29384a]">{SEGMENT_LABELS[c.segment]}</td>
                    <td className="px-4 py-3 text-center text-xs font-mono text-[#29384a]">
                      {c.recipient_count ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.status === 'sent' ? (
                        <div className="text-xs">
                          <span className="font-semibold text-green-700">{c.sent_count}</span>
                          {c.failed_count > 0 && <span className="ml-1 text-red-500">({c.failed_count} ✗)</span>}
                        </div>
                      ) : <span className="text-xs text-[#9ca3af]">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status}/></td>
                    <td className="px-4 py-3 text-xs text-[#29384a]">
                      {c.sent_at ? fmtDate(c.sent_at) : fmtDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {c.status === 'draft' && (
                          <>
                            <button type="button" onClick={() => { setEditTarget(c); setShowEditor(true); }}
                              className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e9d8]" title="Editar">
                              <Edit2 className="h-3.5 w-3.5"/>
                            </button>
                            <button type="button" onClick={() => setSendTarget(c)}
                              className="rounded-lg p-1.5 text-white bg-[#07111d] hover:bg-[#1a2a3a]" title="Enviar">
                              <Send className="h-3.5 w-3.5"/>
                            </button>
                            <button type="button" onClick={() => handleDelete(c.id)}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-50" title="Eliminar">
                              <Trash2 className="h-3.5 w-3.5"/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr key={`${c.id}-exp`} className="bg-[#faf7f0]">
                      <td colSpan={8} className="px-8 py-3 text-xs text-[#29384a]">
                        <strong>Asunto:</strong> {c.subject} &nbsp;·&nbsp;
                        <strong>Creada:</strong> {fmtDate(c.created_at)}
                        {c.sent_at && <> &nbsp;·&nbsp; <strong>Enviada:</strong> {fmtDate(c.sent_at)}</>}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditor && (
        <CampaignEditor
          initial={editTarget}
          onClose={() => { setShowEditor(false); setEditTarget(undefined); }}
          onSaved={() => { setShowEditor(false); setEditTarget(undefined); load(); }}
        />
      )}

      {sendTarget && (
        <SendConfirmModal
          campaign={sendTarget}
          onClose={() => setSendTarget(null)}
          onSent={load}
        />
      )}
    </div>
  );
}
