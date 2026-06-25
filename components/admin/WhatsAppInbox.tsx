'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, AlertTriangle, CheckCheck, Phone, ArrowLeft,
  RefreshCw, Plus, Paperclip, Sparkles, X, FileText, Image as ImageIcon,
  FolderOpen, ChevronDown, Smile, UserPlus, Search, BookMarked, Check,
  ClipboardList, ShieldCheck, UserCircle2, CornerUpLeft,
} from 'lucide-react';
import { WaServiceWorkflow } from './WaServiceWorkflow';
import { SERVICES_CATALOG, type CatalogSection } from '@/lib/data/services-catalog';
import Link from 'next/link';
import { WaTemplateModal } from './WaTemplateModal';

// ── Emoji picker ──────────────────────────────────────────────────────────────
const EMOJIS = [
  '😊','👋','🙏','😄','👍','✅','❤️','🌟','💪','🎉',
  '👏','🤝','✨','📋','📄','📅','💼','🏢','💡','📞',
  '📱','💬','🔔','📌','⚠️','❌','🔍','💳','🚀','🌿',
  '😅','🤔','😍','🙌','💯','⭐','🏆','📊','📈','🔑',
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-2xl border border-[#d8cbb5] bg-white p-2 shadow-xl sm:right-auto sm:w-[300px]">
      <div className="grid grid-cols-8 gap-0.5 sm:grid-cols-10">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => { onSelect(emoji); onClose(); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-[#f0e9d8] active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Client vs Lead badge ──────────────────────────────────────────────────────
function leadStatusLabel(status?: string | null) {
  const map: Record<string, string> = {
    new: 'nuevo',
    contacted: 'contactado',
    quoted: 'presupuesto',
    converted: 'convertido',
    lead_start: 'nuevo',
    lead_viability: 'viabilidad',
    lead_auth_required: 'pend. login',
    lead_profile_required: 'pend. perfil',
    lead_ready_to_contract: 'listo',
    lead_human_review: 'rev. humana',
    call_recommended: 'llamada',
    meeting_recommended: 'reunion',
    free_consult: 'consulta',
  };
  return status ? (map[status] ?? status.replace(/_/g, ' ')) : 'nuevo';
}

function ContactBadge({ isClient, caseCount, leadStatus }: { isClient: boolean; caseCount?: number; leadStatus?: string | null }) {
  return isClient ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
      <ShieldCheck className="h-2.5 w-2.5" />
      Cliente{caseCount ? ` · ${caseCount} exp.` : ''}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
      <UserCircle2 className="h-2.5 w-2.5" />
      Lead · {leadStatusLabel(leadStatus)}
    </span>
  );
}

// ── Link / Create contact modal ───────────────────────────────────────────────
function LinkClientModal({ phone, onLinked, onClose }: {
  phone: string;
  onLinked: (client: { id: string; full_name: string | null; email: string | null; role?: string | null }, isNew?: boolean) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'search' | 'create'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; full_name: string | null; email: string | null; phone: string | null; role: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'search' || query.length < 2) {
      const clearId = window.setTimeout(() => {
        setResults([]);
        setLinkError(null);
      }, 0);
      return () => window.clearTimeout(clearId);
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setLinkError(null);
      try {
        const res = await fetch(`/api/admin/whatsapp/link-client?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) { setLinkError(data.error ?? 'Error al buscar contactos'); return; }
        setResults(data.clients ?? []);
      } catch {
        setLinkError('Error de conexión');
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, tab]);

  const link = async (clientId: string) => {
    setLinking(true);
    setLinkError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/link-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, clientId, savePhone: true }),
      });
      const data = await res.json();
      if (!res.ok) { setLinkError(data.error ?? 'Error al vincular contacto'); return; }
      if (data.client) onLinked(data.client, false);
    } catch {
      setLinkError('Error de conexión');
    } finally { setLinking(false); }
  };

  const create = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/link-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, full_name: newName.trim(), email: newEmail.trim(), create: true }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? 'Error al crear contacto'); return; }
      if (data.client) onLinked({ ...data.client, full_name: data.client.full_name ?? newName.trim() }, true);
    } catch {
      setCreateError('Error de conexión');
    } finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-[#07111d]">Vincular contacto</p>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 hover:bg-[#f0e9d8]">
            <X className="h-4 w-4 text-[#29384a]" />
          </button>
        </div>
        <p className="mb-3 text-xs text-[#29384a]">Número: <strong>{phone}</strong></p>

        <div className="mb-4 flex rounded-xl border border-[#d8cbb5] p-0.5">
          {(['search', 'create'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                tab === t ? 'bg-[#25D366] text-white' : 'text-[#29384a] hover:bg-[#f0e9d8]'
              }`}
            >
              {t === 'search' ? '🔍 Buscar existente' : '➕ Crear nuevo'}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre, email o teléfono…"
                className="w-full rounded-xl border border-[#d8cbb5] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#25D366]"
              />
            </div>
            {linkError && <p className="mt-1 text-xs text-red-600">{linkError}</p>}
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
              {loading && <p className="py-3 text-center text-xs text-[#29384a]">Buscando…</p>}
              {!loading && query.length >= 2 && results.length === 0 && !linkError && (
                <p className="py-3 text-center text-xs text-[#29384a]">Sin resultados — prueba a crear un nuevo contacto</p>
              )}
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={linking}
                  onClick={() => link(c.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#d8cbb5] px-3 py-2.5 text-left transition hover:border-[#25D366] hover:bg-[#f9fff9] disabled:opacity-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-xs font-bold text-[#1a9e4a]">
                    {(c.full_name ?? c.email ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-[#07111d]">{c.full_name ?? '—'}</p>
                      <ContactBadge isClient={c.role === 'client'} />
                    </div>
                    {c.email && <p className="truncate text-xs text-[#29384a]">{c.email}</p>}
                    {c.phone && <p className="text-[10px] text-[#9ca3af]">{c.phone}</p>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'create' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#07111d]">Nombre completo *</label>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre Apellido"
                className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#25D366]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#07111d]">Email *</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#25D366]"
              />
            </div>
            <p className="text-[10px] text-[#29384a]">
              Teléfono: <strong>{phone}</strong> · Se creará cuenta de cliente y se enviará email de activación.
            </p>
            {createError && <p className="text-xs text-red-600">{createError}</p>}
            <button
              type="button"
              onClick={create}
              disabled={creating || !newName.trim() || !newEmail.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851] disabled:opacity-50"
            >
              {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {creating ? 'Creando…' : 'Crear contacto'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface WaCase { id: string; service: string; state: string }

type WaQuickReply = { id: string; title: string };

interface WaMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  created_at: string;
  needs_review: boolean;
  ai_responded: boolean;
  read_at: string | null;
  media_url: string | null;
  media_type: string | null;
  meta_media_id?: string | null;
  case_id: string | null;
  case: WaCase | null;
  reply_to_message_id: string | null;
  reply_to_whatsapp_message_id: string | null;
  quoted_body_snapshot: string | null;
  quoted_direction: 'inbound' | 'outbound' | null;
  quoted_created_at: string | null;
}

interface Conversation {
  phone: string;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientRole?: string | null;
  leadId?: string | null;
  leadStatus?: string | null;
  lastSelectedService?: string | null;
  openCaseCount?: number;
  messages: WaMessage[];
  unread: number;
  needsReview: boolean;
  lastAt: string;
}

const MONTH = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtTime(d: string) {
  const dt = new Date(d);
  const now = new Date();
  if (dt.toDateString() === now.toDateString())
    return `${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
  return `${dt.getDate()} ${MONTH[dt.getMonth()]}`;
}

function messageSnippet(msg: Pick<WaMessage, 'body' | 'media_type'>, max = 120) {
  if (msg.media_type === 'image') return '📷 Imagen';
  if (msg.media_type === 'audio') return '🎤 Audio';
  if (msg.media_type === 'video') return '🎥 Vídeo';
  if (msg.media_type) return '📎 Documento';
  return stripInteractiveLogPrefix(msg.body).replace(/\s+/g, ' ').trim().slice(0, max);
}

function stripInteractiveLogPrefix(body: string) {
  const adminButtons = body.match(/^\[Admin:buttons\]\s*([\s\S]*?)\s\|\s[^\n]+$/);
  return adminButtons?.[1] ?? body;
}

function stripVisualQuote(body: string) {
  return stripInteractiveLogPrefix(body).replace(/^_Respondiendo a (?:Cliente|EXPERT): «[^»]{0,140}»_\n\n/, '');
}

function Avatar({ name, isClient }: { name: string | null; isClient: boolean }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  return (
    <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
      isClient ? 'bg-emerald-100 text-emerald-700' : 'bg-[#f0e9d8] text-[#8a6d3b]'
    }`}>
      {initials}
      {/* Status dot */}
      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
        isClient ? 'bg-emerald-500' : 'bg-amber-400'
      }`} />
    </div>
  );
}

function MediaPreview({ url, type, conversationId, canRetry, onRetried }: {
  url: string | null;
  type: string;
  conversationId: string;
  canRetry: boolean;
  onRetried: (newUrl: string) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function handleRetry() {
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/retry-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (data.ok && data.url) {
        onRetried(data.url);
      } else {
        setRetryError(data.error ?? 'Error desconocido');
      }
    } catch {
      setRetryError('Error de red');
    } finally {
      setRetrying(false);
    }
  }

  if (!url?.startsWith('http')) {
    const icon = type === 'image' ? '📷' : type === 'audio' ? '🎤' : type === 'video' ? '🎥' : '📄';
    return (
      <div className="mt-1 flex flex-col gap-1">
        <span className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-[#fdf6ec]/80 px-3 py-2 text-xs text-[#8a6d3b]">
          {icon} Archivo no guardado
          {canRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="ml-auto rounded bg-[#c88b25] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#a06e1a] disabled:opacity-50"
            >
              {retrying ? '…' : 'Reintentar'}
            </button>
          )}
        </span>
        {retryError && <span className="text-[10px] text-red-500">{retryError}</span>}
      </div>
    );
  }

  const safeUrl = url as string;
  if (type === 'image') {
    return (
      <a href={safeUrl} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={safeUrl} alt="Imagen adjunta" className="mt-1 max-h-48 max-w-full rounded-xl object-cover" />
      </a>
    );
  }
  return (
    <a href={safeUrl} target="_blank" rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white/80 px-3 py-2 text-xs font-semibold text-[#07111d] hover:bg-white"
    >
      <FileText className="h-4 w-4 text-[#c88b25]" />
      Ver documento
    </a>
  );
}

// ── New conversation modal ─────────────────────────────────────────────────────
function NewConvModal({ onClose, onSent }: {
  onClose: () => void;
  onSent: (phone: string, previewText: string) => void;
}) {
  const [mode, setMode] = useState<'choose' | 'freeform' | 'template'>('choose');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendFreeform = async () => {
    if (!phone.trim() || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), body: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); return; }
      onSent(phone.trim(), text.trim());
      onClose();
    } catch {
      setError('Error de conexión');
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
          <p className="font-semibold text-[#07111d]">Nueva conversación</p>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f0e9d8]">
            <X className="h-4 w-4 text-[#29384a]" />
          </button>
        </div>
        {mode === 'choose' && (
          <div className="space-y-3 p-5">
            <p className="text-xs text-[#29384a]">
              Si el cliente no te ha escrito en las últimas 24h debes usar una plantilla aprobada por Meta.
            </p>
            <button type="button" onClick={() => setMode('template')}
              className="flex w-full items-center gap-3 rounded-xl border border-[#d8cbb5] p-4 text-left transition hover:border-[#25D366] hover:bg-[#f9fff9]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#1a9e4a]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#07111d]">Usar plantilla aprobada</p>
                <p className="text-xs text-[#29384a]">Recomendado para iniciar conversación</p>
              </div>
            </button>
            <button type="button" onClick={() => setMode('freeform')}
              className="flex w-full items-center gap-3 rounded-xl border border-[#d8cbb5] p-4 text-left transition hover:border-[#25D366] hover:bg-[#f9fff9]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#07111d]">Mensaje de texto libre</p>
                <p className="text-xs text-[#29384a]">Solo si el cliente ya ha escrito antes</p>
              </div>
            </button>
          </div>
        )}
        {mode === 'freeform' && (
          <div className="space-y-4 p-5">
            <button type="button" onClick={() => setMode('choose')} className="text-xs text-[#c88b25] hover:underline">← Volver</button>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#07111d]">Número de teléfono (con prefijo)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="34612345678"
                className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#25D366]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#07111d]">Mensaje</label>
              <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe el mensaje..."
                className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#25D366]" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="button" onClick={sendFreeform} disabled={sending || !phone.trim() || !text.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:bg-[#1da851] disabled:opacity-50">
              <Send className="h-4 w-4" />
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </div>
        )}
        {mode === 'template' && (
          <WaTemplateModal embedded onClose={onClose} onSent={onSent} />
        )}
      </div>
    </div>
  );
}

const CASE_CATEGORIES = ['Fiscal', 'Extranjería', 'Empresa', 'Notaría', 'Tráfico', 'Otros'];

function CaseAssign({ clientId, currentCaseId, phone, onAssigned }: {
  clientId: string;
  currentCaseId: string | null;
  phone: string;
  onAssigned: (caseId: string | null) => void;
}) {
  const [cases, setCases] = useState<WaCase[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newService, setNewService] = useState('');
  const [newCategory, setNewCategory] = useState(CASE_CATEGORIES[0]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadCases = () => {
    setLoading(true);
    fetch(`/api/admin/cases?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => setCases(d.cases ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(loadCases, 0);
    return () => window.clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId]);

  const assign = async (caseId: string | null) => {
    setOpen(false);
    await fetch('/api/admin/whatsapp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, caseId }),
    });
    onAssigned(caseId);
  };

  const createAndAssign = async () => {
    if (!newService.trim()) return;
    setSaveLoading(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, service: newService.trim(), category: newCategory }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error ?? 'Error al crear'); return; }
      const created: WaCase = data.case;
      setCases((prev) => [created, ...prev]);
      setCreating(false);
      setNewService('');
      await assign(created.id);
    } catch {
      setSaveError('Error de conexión');
    } finally { setSaveLoading(false); }
  };

  return (
    <div className="relative">
      <button type="button"
        onClick={() => { setOpen((o) => !o); setCreating(false); setSaveError(null); }}
        className="flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/20"
      >
        <FolderOpen className="h-3 w-3" />
        <span className="hidden sm:inline">{currentCaseId ? 'Expediente' : 'Asignar'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-[#d8cbb5] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#f0e9d8] px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#29384a]">Expedientes</span>
            <button type="button"
              onClick={() => { setCreating((c) => !c); setSaveError(null); setNewService(''); }}
              className="flex items-center gap-1 rounded-lg bg-[#07111d] px-2 py-1 text-[10px] font-bold text-white transition hover:bg-[#1a2e44]"
            >
              <Plus className="h-3 w-3" />Nuevo
            </button>
          </div>
          {creating && (
            <div className="border-b border-[#f0e9d8] bg-[#faf8f2] px-3 py-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#c88b25]">Crear y asignar</p>
              <input autoFocus type="text" value={newService} onChange={(e) => setNewService(e.target.value)}
                placeholder="Nombre del servicio…"
                className="w-full rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-xs outline-none focus:border-[#25D366]" />
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                aria-label="Categoría del expediente"
                className="w-full rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-xs outline-none focus:border-[#25D366] bg-white">
                {CASE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {saveError && <p className="text-[10px] text-red-600">{saveError}</p>}
              <button type="button" onClick={createAndAssign} disabled={saveLoading || !newService.trim()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-1.5 text-xs font-bold text-white transition hover:bg-[#1da851] disabled:opacity-50">
                {saveLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <FolderOpen className="h-3 w-3" />}
                {saveLoading ? 'Creando…' : 'Crear y asignar'}
              </button>
            </div>
          )}
          {loading && <p className="px-3 py-3 text-xs text-[#29384a]">Cargando…</p>}
          {!loading && cases.length === 0 && !creating && (
            <p className="px-3 py-3 text-xs text-[#29384a]">Sin expedientes — pulsa &quot;Nuevo&quot;</p>
          )}
          {currentCaseId && (
            <button type="button" onClick={() => assign(null)}
              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50">
              ✕ Desasignar
            </button>
          )}
          {cases.map((c) => (
            <button key={c.id} type="button" onClick={() => assign(c.id)}
              className={`w-full px-3 py-2.5 text-left transition hover:bg-[#faf8f2] ${c.id === currentCaseId ? 'bg-[#fdf7e9]' : ''}`}>
              <p className="text-xs font-semibold text-[#07111d]">{c.service}</p>
              <p className="text-[10px] text-[#29384a]">{c.state}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Service catalog modal ──────────────────────────────────────────────────────
function CatalogModal({ phone, onClose, onSent }: {
  phone: string;
  onClose: () => void;
  onSent: (preview: string) => void;
}) {
  const [mode, setMode] = useState<'list' | 'cards'>('list');
  // For cards mode: select which sections to send
  const [selected, setSelected] = useState<Set<string>>(new Set(SERVICES_CATALOG.map((s) => s.id)));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const send = async () => {
    if (mode === 'cards' && selected.size === 0) return;
    setSending(true);
    setError(null);
    try {
      if (mode === 'list') {
        // List mode: always sends all 7 categories (user selects one → bot replies with services)
        const res = await fetch('/api/admin/whatsapp/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) { setError(`${data.error ?? 'Error al enviar'}${data.detail ? ` — ${JSON.stringify(data.detail)}` : ''}`); return; }
        onSent('[Catálogo] Menú de 7 categorías');
      } else {
        // Cards mode: sends a button card per selected section
        const res = await fetch('/api/admin/whatsapp/catalog-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, sectionIds: [...selected] }),
        });
        const data = await res.json();
        if (!res.ok) { setError(`${data.error ?? 'Error al enviar'}${data.detail ? ` — ${JSON.stringify(data.detail)}` : ''}`); return; }
        const names = SERVICES_CATALOG.filter((s) => selected.has(s.id)).map((s) => `${s.emoji} ${s.title}`).join(', ');
        onSent(`[Tarjetas] ${names}`);
      }
      onClose();
    } catch {
      setError('Error de conexión');
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
          <div>
            <p className="font-semibold text-[#07111d]">Catálogo de servicios</p>
            <p className="text-xs text-[#29384a]">
              {mode === 'list'
                ? '7 categorías · el usuario elige una y recibe los servicios'
                : selected.size > 0
                  ? `${selected.size} sección${selected.size > 1 ? 'es' : ''} · tarjeta por sección`
                  : 'Selecciona al menos una sección'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f0e9d8]">
            <X className="h-4 w-4 text-[#29384a]" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {(['list', 'cards'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${mode === m ? 'bg-[#25D366] text-white' : 'bg-[#f0e9d8] text-[#29384a] hover:bg-[#e8deca]'}`}>
              {m === 'list' ? '📋 Menú de categorías' : '🃏 Tarjetas por sección'}
            </button>
          ))}
        </div>

        {mode === 'list' ? (
          // List mode: preview of all 7 categories — no selection needed
          <div className="px-4 py-3 space-y-1.5">
            <p className="text-[10px] text-[#29384a]/70 mb-2">
              Se envía una lista con las 7 categorías. Al tocar una, se despliegan sus servicios automáticamente.
            </p>
            {SERVICES_CATALOG.map((section: CatalogSection) => (
              <div key={section.id} className="flex items-center gap-2 rounded-lg border border-[#f0e9d8] bg-[#fafaf8] px-3 py-2">
                <span className="text-base">{section.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#07111d]">{section.title}</p>
                  <p className="text-[10px] text-[#29384a]/60">{section.services.length} servicios</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Cards mode: select which sections to send as button cards
          <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2">
            {SERVICES_CATALOG.map((section: CatalogSection) => {
              const on = selected.has(section.id);
              return (
                <button key={section.id} type="button" onClick={() => toggle(section.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${on ? 'border-[#25D366] bg-[#f0fff5]' : 'border-[#d8cbb5] bg-white hover:border-[#25D366]/50 hover:bg-[#f9fff9]'}`}>
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-[#25D366] bg-[#25D366]' : 'border-[#d8cbb5]'}`}>
                    {on && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#07111d]">{section.emoji} {section.title}</p>
                    <p className="mt-0.5 text-xs text-[#29384a]">{section.services.slice(0, 3).map((s) => s.title).join(' · ')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="border-t border-[#f0e9d8] px-4 py-3 space-y-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="button" onClick={send} disabled={sending || (mode === 'cards' && selected.size === 0)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:bg-[#1da851] disabled:opacity-50">
            <BookMarked className="h-4 w-4" />
            {sending ? 'Enviando…' : mode === 'cards' ? `Enviar ${selected.size} tarjeta${selected.size !== 1 ? 's' : ''}` : 'Enviar menú de categorías'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function WhatsAppInbox({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ url: string; waType: string; filename: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLinkClient, setShowLinkClient] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [inboxToast, setInboxToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [replyTo, setReplyTo] = useState<WaMessage | null>(null);
  const [aiQuickReplies, setAiQuickReplies] = useState<WaQuickReply[]>([]);
  const [wabaAction, setWabaAction] = useState<'test' | 'profile' | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.phone === selected) ?? null;

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: selected ? 'smooth' : 'instant' });
    }
  }, [activeConv?.messages.length, selected]);

  useEffect(() => {
    if (selected && window.innerWidth < 1024) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [selected]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { void loadConversations(); }, 0);
    return () => window.clearTimeout(id);
  }, [loadConversations]);
  useEffect(() => {
    const id = setInterval(loadConversations, 30_000);
    return () => clearInterval(id);
  }, [loadConversations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSelectConversation = (phone: string) => {
    setSelected(phone);
    setError(null);
    setReply('');
    setAiQuickReplies([]);
    setPendingFile(null);
    setReplyTo(null);
    fetch('/api/admin/whatsapp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, markRead: true }),
    }).catch(() => {});
    setConversations((prev) => prev.map((c) =>
      c.phone === phone ? { ...c, unread: 0, needsReview: false } : c
    ));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/whatsapp/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al subir archivo'); return; }
      setPendingFile({ url: data.url, waType: data.waType, filename: data.filename });
    } catch {
      setError('Error al subir el archivo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const KIA_TOOL_LABELS: Record<string, string> = {
    get_client_profile: 'perfil del cliente',
    get_case_status: 'estado del expediente',
    get_company_status_snapshot: 'estado contable',
    get_holded_connection_status: 'conexión Holded',
    get_service_registry_item: 'información del servicio',
    run_readiness_check: 'checklist de viabilidad',
    run_viability_check: 'viabilidad del servicio',
    generate_checkout_gate_link: 'enlace de contratación',
    generate_profile_link: 'enlace de perfil',
    generate_holded_connection_link: 'enlace Holded',
    extract_invoice_ocr: 'datos de la factura',
    resolve_contact_context: 'contexto del contacto',
    create_next_best_action: 'siguiente mejor acción',
    create_internal_task: 'tarea interna',
  };

  const handleAiCompose = async () => {
    if (!activeConv) return;
    setAiLoading(true);
    setAiProgress(null);
    setError(null);

    const isEditMode = reply.trim().length > 0;

    try {
      if (isEditMode) {
        // Edit mode: improve/translate admin's draft — regular endpoint
        setAiProgress('Mejorando borrador…');
        const res = await fetch('/api/admin/whatsapp/ai-compose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: activeConv.clientId,
            phone: activeConv.phone,
            history: activeConv.messages.slice(-30).map((m) => ({
              direction: m.direction,
              body: stripVisualQuote(m.body),
              ai_responded: m.ai_responded,
            })),
            intent: reply.trim(),
            mode: 'edit',
            ...(replyTo && {
              replyTo: {
                direction: replyTo.direction,
                body: stripVisualQuote(replyTo.body),
                created_at: replyTo.created_at,
                media_type: replyTo.media_type ?? null,
              },
            }),
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Error IA'); return; }
        setReply(data.draft ?? '');
        setAiQuickReplies(Array.isArray(data.quickReplies) ? data.quickReplies.slice(0, 3) : []);
        textareaRef.current?.focus();
        return;
      }

      // Compose mode: stream events from SSE endpoint
      setAiProgress('Kia está pensando…');
      const res = await fetch('/api/admin/whatsapp/ai-compose/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeConv.clientId,
          phone: activeConv.phone,
          history: activeConv.messages.slice(-30).map((m) => ({
            direction: m.direction,
            body: stripVisualQuote(m.body),
            ai_responded: m.ai_responded,
          })),
          ...(replyTo && {
            replyTo: {
              direction: replyTo.direction,
              body: stripVisualQuote(replyTo.body),
              created_at: replyTo.created_at,
              media_type: replyTo.media_type ?? null,
            },
          }),
        }),
      });

      if (!res.ok || !res.body) {
        setError('Error IA');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(part.slice(6)) as {
              type: string;
              tool?: string;
              ok?: boolean;
              draft?: string;
              quickReplies?: WaQuickReply[];
              message?: string;
            };
            if (event.type === 'thinking') {
              setAiProgress('Kia está pensando…');
            } else if (event.type === 'classifying') {
              setAiProgress('Analizando intención…');
            } else if (event.type === 'tool_call' && event.tool) {
              setAiProgress(`Consultando ${KIA_TOOL_LABELS[event.tool] ?? event.tool}…`);
            } else if (event.type === 'judging') {
              setAiProgress('Validando decisión…');
            } else if (event.type === 'complete') {
              setReply(event.draft ?? '');
              setAiQuickReplies(Array.isArray(event.quickReplies) ? event.quickReplies.slice(0, 3) : []);
              textareaRef.current?.focus();
            } else if (event.type === 'error') {
              setError(event.message ?? 'Error IA');
            }
          } catch { /* ignore malformed SSE chunks */ }
        }
      }
    } catch {
      setError('Error al generar borrador.');
    } finally {
      setAiLoading(false);
      setAiProgress(null);
    }
  };

  const handleSend = async () => {
    const text = reply.trim();
    if ((!text && !pendingFile) || !selected) return;
    setSending(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { phone: selected };
      if (replyTo) payload.replyToMessageId = replyTo.id;
      if (pendingFile) {
        payload.mediaUrl  = pendingFile.url;
        payload.mediaType = pendingFile.waType;
        payload.mediaFilename = pendingFile.filename;
        if (text) payload.caption = text;
      } else {
        payload.body = text;
        if (aiQuickReplies.length >= 2) payload.quickReplies = aiQuickReplies;
      }
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail?.error_data?.details ?? '';
        setError(`${data.error ?? 'Error al enviar'}${detail ? ` — ${detail}` : ''}`);
        return;
      }
      const newMsg: WaMessage = {
        id: crypto.randomUUID(),
        direction: 'outbound',
        body: pendingFile
          ? (text || `[${pendingFile.waType}]`)
          : aiQuickReplies.length >= 2
            ? `[Admin:buttons] ${text} | ${aiQuickReplies.map((button) => button.title).join(' / ')}`
            : text,
        created_at: new Date().toISOString(),
        needs_review: false,
        ai_responded: false,
        read_at: null,
        media_url: pendingFile?.url ?? null,
        media_type: pendingFile?.waType ?? null,
        case_id: null,
        case: null,
        reply_to_message_id: replyTo?.id ?? null,
        reply_to_whatsapp_message_id: replyTo?.reply_to_whatsapp_message_id ?? null,
        quoted_body_snapshot: replyTo ? messageSnippet(replyTo) : null,
        quoted_direction: replyTo?.direction ?? null,
        quoted_created_at: replyTo?.created_at ?? null,
      };
      setConversations((prev) => prev.map((c) => {
        if (c.phone !== selected) return c;
        return {
          ...c, unread: 0, needsReview: false, lastAt: newMsg.created_at,
          messages: [...c.messages.map((m) => ({ ...m, needs_review: false })), newMsg],
        };
      }));
      setReply('');
      setAiQuickReplies([]);
      setPendingFile(null);
      setReplyTo(null);
      textareaRef.current?.focus();
    } catch {
      setError('Error de conexión.');
    } finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) { setReply((r) => r + emoji); return; }
    const start = el.selectionStart ?? reply.length;
    const end   = el.selectionEnd   ?? reply.length;
    setReply(reply.slice(0, start) + emoji + reply.slice(end));
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const showInboxToast = (msg: string, ok: boolean) => {
    setInboxToast({ msg, ok });
    setTimeout(() => setInboxToast(null), 3500);
  };

  const handleWabaTest = async () => {
    setWabaAction('test');
    try {
      const res = await fetch('/api/admin/whatsapp/test-connection', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const missing = Array.isArray(data.missing) && data.missing.length > 0
          ? `: faltan ${data.missing.join(', ')}`
          : '';
        showInboxToast(`WABA no está listo${missing}`, false);
        return;
      }
      showInboxToast('WABA conectado correctamente', true);
    } catch {
      showInboxToast('No se pudo comprobar WABA', false);
    } finally {
      setWabaAction(null);
    }
  };

  const handleWabaProfile = async () => {
    if (!window.confirm('Actualizar la foto de perfil WABA con la imagen de Kia?')) return;
    setWabaAction('profile');
    try {
      const res = await fetch('/api/admin/waba-profile', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showInboxToast(data.detail ?? data.error ?? 'No se pudo actualizar el perfil WABA', false);
        return;
      }
      showInboxToast('Perfil WABA actualizado', true);
    } catch {
      showInboxToast('No se pudo actualizar el perfil WABA', false);
    } finally {
      setWabaAction(null);
    }
  };

  const handleClientLinked = (client: { id: string; full_name: string | null; email: string | null; role?: string | null }, isNew = false) => {
    if (!selected) return;
    setConversations((prev) => prev.map((c) =>
      c.phone !== selected ? c : {
        ...c,
        clientId: client.id,
        clientName: client.full_name,
        clientEmail: client.email,
        clientRole: client.role,
      }
    ));
    setShowLinkClient(false);
    showInboxToast(
      isNew
        ? `✅ Contacto creado — email de activación enviado a ${client.email}`
        : '✅ Contacto vinculado correctamente',
      true
    );
  };

  const handleNewConvSent = useCallback((phone: string, previewText: string) => {
    const normalized = phone.replace(/\D/g, '');
    setConversations((prev) => {
      const exists = prev.find((c) => c.phone === normalized);
      const newMsg: WaMessage = {
        id: crypto.randomUUID(), direction: 'outbound', body: previewText,
        created_at: new Date().toISOString(), needs_review: false, ai_responded: false,
        read_at: null, media_url: null, media_type: null, case_id: null, case: null,
        reply_to_message_id: null, reply_to_whatsapp_message_id: null,
        quoted_body_snapshot: null, quoted_direction: null, quoted_created_at: null,
      };
      if (exists) {
        return prev.map((c) => c.phone !== normalized ? c : {
          ...c, messages: [...c.messages, newMsg], lastAt: newMsg.created_at,
        });
      }
      return [{
        phone: normalized, clientId: null, clientName: null, clientEmail: null, clientRole: null,
        leadId: null, leadStatus: null, lastSelectedService: null, openCaseCount: 0,
        messages: [newMsg], unread: 0, needsReview: false, lastAt: newMsg.created_at,
      }, ...prev];
    });
    setSelected(normalized);
    setShowNewModal(false);
    setTimeout(loadConversations, 3000);
  }, [loadConversations]);

  const handleCaseAssigned = (caseId: string | null) => {
    if (!selected) return;
    setConversations((prev) => prev.map((c) =>
      c.phone !== selected ? c : {
        ...c, messages: c.messages.map((m) => ({ ...m, case_id: caseId, case: null })),
      }
    ));
  };

  const insertQuickReply = (text: string) => {
    setReply(text);
    setAiQuickReplies([]);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const appUrl = (path: string) => {
    if (typeof window === 'undefined') return `https://expertconsulting.es${path}`;
    return `${window.location.origin}${path}`;
  };

  const totalUnread  = conversations.reduce((s, c) => s + c.unread, 0);
  const totalReview  = conversations.filter((c) => c.needsReview).length;
  const currentCaseId = activeConv?.messages.findLast((m) => m.case_id)?.case_id ?? null;

  // ── Contact list ─────────────────────────────────────────────────────────────
  const ContactList = (
    <aside className={`flex flex-col bg-white ${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-[280px] lg:shrink-0 lg:border-r lg:border-[#d8cbb5]`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d8cbb5] bg-[#075e54] px-4 py-3">
        <div>
          <h1 className="font-serif text-base font-bold text-white">WABA / WhatsApp</h1>
          <p className="mt-0.5 text-[11px] text-white/70">
            {totalUnread > 0 && <span className="font-semibold text-[#d7e86d]">{totalUnread} sin leer · </span>}
            {totalReview > 0 && <span className="font-semibold text-red-300">{totalReview} rev. · </span>}
            {conversations.length} conv.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={handleWabaTest} disabled={Boolean(wabaAction)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 disabled:opacity-40" title="Probar conexión WABA">
            {wabaAction === 'test' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          </button>
          <button type="button" onClick={handleWabaProfile} disabled={Boolean(wabaAction)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 disabled:opacity-40" title="Actualizar perfil WABA">
            {wabaAction === 'profile' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => setShowNewModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25" title="Nueva conversación">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 disabled:opacity-40" title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter legend */}
      <div className="flex items-center gap-3 border-b border-[#f0e9d8] bg-[#faf8f2] px-4 py-2">
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />Cliente portal
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-400" />Lead / contacto
        </span>
      </div>

      {/* List */}
      <ul className="flex-1 divide-y divide-[#f5f0e8] overflow-y-auto">
        {conversations.length === 0 && (
          <li className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <Phone className="h-8 w-8 text-[#d8cbb5]" />
            <p className="text-sm text-[#29384a]">Sin conversaciones aún</p>
            <p className="text-xs text-[#29384a]/50">Los mensajes de WhatsApp aparecerán aquí.</p>
          </li>
        )}
        {conversations.map((conv) => {
          const isClient  = Boolean(conv.clientId);
          const caseCount = conv.openCaseCount || new Set(conv.messages.map((m) => m.case_id).filter(Boolean)).size || undefined;
          const lastMsg   = conv.messages.at(-1);
          const preview   = lastMsg?.body
            ? stripVisualQuote(lastMsg.body).replace(/^\[Kia[^\]]*\]\s*/,'').replace(/^\[Catálogo\]\s*/,'').slice(0, 60)
            : '';
          return (
            <li key={conv.phone}>
              <button type="button" onClick={() => handleSelectConversation(conv.phone)}
                className={`flex w-full items-start gap-3 px-3 py-3 text-left transition active:bg-[#f0e9d8] ${
                  selected === conv.phone ? 'bg-[#e8f5e9]' : 'hover:bg-[#faf8f2]'
                }`}
              >
                <Avatar name={conv.clientName} isClient={isClient} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-[13px] font-semibold text-[#07111d]">
                      {conv.clientName ?? conv.phone}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#29384a]/50">{fmtTime(conv.lastAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <ContactBadge isClient={isClient} caseCount={isClient ? caseCount : undefined} leadStatus={conv.leadStatus} />
                    {conv.clientName && (
                      <span className="truncate text-[10px] text-[#29384a]/50">{conv.phone}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-[#29384a]/70">
                      {lastMsg?.direction === 'outbound' && <span className="text-[#29384a]/40">↩ </span>}
                      {preview || <span className="italic text-[#29384a]/40">Archivo adjunto</span>}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      {conv.needsReview && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      {conv.unread > 0 && (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#25D366] px-1 text-[9px] font-bold text-white">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );

  // ── Thread panel ─────────────────────────────────────────────────────────────
  const isActiveClient = Boolean(activeConv?.clientId);
  const activeCase = activeConv?.messages.findLast((m) => m.case)?.case ?? null;
  const activeCaseLabel = activeCase?.service ?? (currentCaseId ? 'Expediente asignado' : null);
  const QuickActions = activeConv ? (
    <div className="flex gap-1 overflow-x-auto border-b border-black/10 bg-white/90 px-3 py-2 sm:px-4">
      {isActiveClient ? (
        <>
          <button type="button" onClick={() => insertQuickReply('Te confirmo que revisamos el estado de tu expediente y te actualizamos por aquí en cuanto lo tengamos comprobado.')}
            className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100">
            Estado expediente
          </button>
          <button type="button" onClick={() => insertQuickReply('Para avanzar con tu expediente, por favor envíanos por aquí la documentación pendiente en PDF o imagen legible.')}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Pedir documentos
          </button>
          <button type="button" onClick={() => insertQuickReply(`Puedes completar o actualizar tu perfil desde aquí: ${appUrl('/dashboard/perfil')}`)}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Completar perfil
          </button>
          <button type="button" onClick={() => setShowCatalog(true)}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Nuevo servicio
          </button>
          <button type="button" onClick={() => insertQuickReply(`Para revisarlo con el equipo de EXPERT, puedes reservar una llamada de 15 min aqui: ${appUrl('/cita')}`)}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Hablar equipo
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setShowCatalog(true)}
            className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100">
            Enviar catálogo
          </button>
          <button type="button" onClick={() => insertQuickReply(`Para comprobar la viabilidad de tu trámite, empieza por aquí: ${appUrl('/servicios')}\n\nSi me dices qué necesitas, también puedo orientarte antes de contratar.`)}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Viabilidad
          </button>
          <button type="button" onClick={() => insertQuickReply(`Para contratar o crear tu acceso, entra aquí: ${appUrl('/auth/signup')}`)}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Login/registro
          </button>
          <button type="button" onClick={() => insertQuickReply(`Puedes reservar una llamada de 15 min aquí: ${appUrl('/cita')}`)}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Llamada 15 min
          </button>
          <button type="button" onClick={() => setShowLinkClient(true)}
            className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#29384a] hover:bg-[#faf8f2]">
            Crear cliente
          </button>
        </>
      )}
    </div>
  ) : null;

  const ThreadPanel = (
    <div className={`wa-chat-bg flex flex-col ${selected ? 'flex' : 'hidden lg:flex'} flex-1 min-w-0 min-h-0`}>
      {!activeConv ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-sm text-[#29384a]/60">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/60">
            <Phone className="h-10 w-10 text-[#d8cbb5]" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Selecciona una conversación</p>
            <p className="mt-1 text-xs">Los mensajes aparecerán aquí</p>
          </div>
        </div>
      ) : (
        <>
          {/* Thread header */}
          <div className="flex items-center gap-2.5 border-b border-black/10 bg-[#075e54] px-3 py-2 sm:px-4">
            <button type="button" onClick={() => setSelected(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 lg:hidden"
              aria-label="Volver">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Avatar name={activeConv.clientName} isClient={isActiveClient} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[15px] font-semibold text-white">
                  {activeConv.clientName ?? activeConv.phone}
                </p>
                <span className={`hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:inline ${
                  isActiveClient ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'
                }`}>
                  {isActiveClient ? `Cliente${activeConv.openCaseCount ? ` · ${activeConv.openCaseCount} exp.` : ''}` : `Lead · ${leadStatusLabel(activeConv.leadStatus)}`}
                </span>
              </div>
              <p className="truncate text-[11px] text-white/60">
                {activeConv.clientName ? `${activeConv.phone}` : 'Sin cuenta registrada'}
                {activeConv.clientEmail && ` · ${activeConv.clientEmail}`}
                {!isActiveClient && activeConv.lastSelectedService && ` · ${activeConv.lastSelectedService}`}
                {activeCaseLabel && ` · ${activeCaseLabel}`}
                {activeConv.clientId && (
                  <> · <Link href={`/admin/clientes/${activeConv.clientId}`} className="underline decoration-white/40 hover:text-white">ficha ↗</Link></>
                )}
              </p>
            </div>
            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {activeConv.needsReview && (
                <span title="Kia no pudo resolver / atencion manual real"><AlertTriangle className="h-4 w-4 text-red-300" /></span>
              )}
              {!activeConv.clientId ? (
                <button type="button" onClick={() => setShowLinkClient(true)}
                  className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/20"
                  title="Vincular cliente">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vincular</span>
                </button>
              ) : (
                <CaseAssign
                  clientId={activeConv.clientId}
                  currentCaseId={currentCaseId}
                  phone={activeConv.phone}
                  onAssigned={handleCaseAssigned}
                />
              )}
            </div>
          </div>

          {QuickActions}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-2 py-3 sm:px-4 space-y-0.5">
            {activeConv.messages.map((msg, i) => {
              const isOut = msg.direction === 'outbound';
              const prev  = activeConv.messages[i - 1];
              const showDateDivider = !prev ||
                new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
              const showTime = !prev ||
                new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;

              return (
                <div key={msg.id}>
                  {showDateDivider && (
                    <div className="my-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-black/10" />
                      <span className="rounded-full bg-black/15 px-3 py-1 text-[10px] font-semibold text-[#29384a]">
                        {new Date(msg.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </span>
                      <div className="h-px flex-1 bg-black/10" />
                    </div>
                  )}
                  {!showDateDivider && showTime && (
                    <div className="my-2 text-center">
                      <span className="text-[10px] text-[#29384a]/50">{fmtTime(msg.created_at)}</span>
                    </div>
                  )}
                  {msg.case && (
                    <div className={`mb-1 flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <span className="flex items-center gap-1 rounded-full bg-[#c88b25]/20 px-2 py-0.5 text-[10px] font-semibold text-[#c88b25]">
                        <FolderOpen className="h-2.5 w-2.5" /> {msg.case.service}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-[2px] group/bubble`}>
                    {/* Reply button — visible on hover */}
                    {!isOut && (
                      <button
                        type="button"
                        onClick={() => { setReplyTo(msg); setTimeout(() => textareaRef.current?.focus(), 50); }}
                        className="mr-1 mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/0 text-[#29384a]/30 opacity-0 transition hover:bg-white hover:text-[#c88b25] group-hover/bubble:opacity-100"
                        aria-label="Responder a este mensaje"
                      >
                        <CornerUpLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className={`relative max-w-[88%] sm:max-w-[72%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed shadow-sm ${
                      isOut
                        ? 'rounded-tr-sm bg-[#d9fdd3] text-[#07111d]'
                        : msg.needs_review
                          ? 'rounded-tl-sm border border-red-200 bg-red-50 text-[#07111d]'
                          : 'rounded-tl-sm bg-white text-[#07111d]'
                    }`}>
                      {/* Quote block — shown when this message is a reply */}
                      {msg.quoted_body_snapshot && (
                        <div className="mb-2 rounded-lg border-l-4 border-[#D4A017] bg-black/5 px-2.5 py-1.5 text-xs">
                          <p className="font-semibold text-[#8a6d3b]">
                            Respuesta a {msg.quoted_direction === 'inbound' ? 'Cliente' : 'EXPERT'}
                          </p>
                        <p className="mt-0.5 line-clamp-2 text-[#07111d]/60">{msg.quoted_body_snapshot}</p>
                        </div>
                      )}
                      {msg.media_type && (
                        <MediaPreview
                          url={msg.media_url}
                          type={msg.media_type}
                          conversationId={msg.id}
                          canRetry={!!msg.meta_media_id && !msg.media_url?.startsWith('http')}
                          onRetried={(newUrl) => {
                            setConversations((prev) =>
                              prev.map((c) =>
                                c.phone === selected
                                  ? { ...c, messages: c.messages.map((m) => m.id === msg.id ? { ...m, media_url: newUrl } : m) }
                                  : c
                              )
                            );
                          }}
                        />
                      )}
                      {msg.body && (
                        <p className="whitespace-pre-wrap break-words">{stripVisualQuote(msg.body)}</p>
                      )}
                      <div className={`mt-0.5 flex items-center gap-1 text-[10px] text-[#29384a]/50 ${isOut ? 'justify-end' : 'justify-start'}`}>
                        {isOut && msg.ai_responded && <Bot className="h-3 w-3 text-[#c88b25]" />}
                        {isOut && !msg.ai_responded && <User className="h-3 w-3" />}
                        <span>{fmtTime(msg.created_at)}</span>
                        {isOut && <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />}
                      </div>
                    </div>
                    {isOut && (
                      <button
                        type="button"
                        onClick={() => { setReplyTo(msg); setTimeout(() => textareaRef.current?.focus(), 50); }}
                        className="ml-1 mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/0 text-[#29384a]/30 opacity-0 transition hover:bg-white hover:text-[#c88b25] group-hover/bubble:opacity-100"
                        aria-label="Responder a este mensaje"
                      >
                        <CornerUpLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Pending file preview */}
          {pendingFile && (
            <div className="flex items-center gap-2 border-t border-black/10 bg-white px-4 py-2">
              {pendingFile.waType === 'image'
                ? <ImageIcon className="h-4 w-4 text-[#25D366]" />
                : <FileText className="h-4 w-4 text-[#c88b25]" />
              }
              <span className="flex-1 truncate text-xs text-[#07111d]">{pendingFile.filename}</span>
              <button type="button" onClick={() => setPendingFile(null)} aria-label="Quitar adjunto" className="text-[#29384a]/60 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error bar */}
          {error && (
            <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>
          )}

          {/* Reply box */}
          <div className="relative border-t border-black/10 bg-[#f0f2f5] px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))] sm:px-3">
            {showEmoji && (
              <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
            )}
            {reply.trim() && !aiLoading && (
              <div className="mb-1.5 flex items-center gap-1.5 px-1">
                <Sparkles className="h-3 w-3 text-[#c88b25]" />
                <span className="text-[11px] text-[#c88b25]">
                  Escribe en español · presiona ✦ para mejorar y traducir al idioma del cliente
                </span>
              </div>
            )}
            {aiLoading && (
              <div className="mb-1.5 flex items-center gap-1.5 px-1">
                <RefreshCw className="h-3 w-3 animate-spin text-[#c88b25]" />
                <span className="text-[11px] text-[#c88b25]">{aiProgress ?? 'Generando respuesta…'}</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {/* File input */}
              <input ref={fileInputRef} type="file" aria-label="Seleccionar archivo adjunto"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,audio/ogg,audio/mpeg"
                onChange={handleFileChange} className="hidden" />

              {/* Reply-to preview bar */}
              {replyTo && (
                <div className="mb-1 flex items-start gap-2 rounded-xl border-l-4 border-[#D4A017] bg-[#fdf6ec] px-3 py-2 text-xs">
                  <div className="flex-1">
                    <p className="font-semibold text-[#8a6d3b]">
                      Respondiendo a {replyTo.direction === 'inbound' ? 'Cliente' : 'EXPERT'}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[#07111d]/70">
                      {messageSnippet(replyTo)}
                    </p>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancelar respuesta" className="ml-1 text-[#29384a]/40 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Textarea + send — full width */}
              <div className="flex items-end gap-1.5">
                <textarea ref={textareaRef} value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  onKeyDown={handleKey}
                  placeholder={pendingFile ? 'Añadir texto (opcional)' : 'Escribe un mensaje'}
                  rows={1}
                  className="min-h-[44px] flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-3 text-[16px] leading-snug text-[#07111d] outline-none placeholder:text-[#29384a]/40 sm:text-sm sm:py-2.5"
                />
                <button type="button" onClick={handleSend} disabled={sending || (!reply.trim() && !pendingFile)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow transition hover:bg-[#1da851] disabled:bg-[#54656f]/50 active:scale-95"
                  aria-label="Enviar">
                  <Send className="h-5 w-5" />
                </button>
              </div>

              {aiQuickReplies.length >= 2 && !pendingFile && (
                <div className="flex items-center gap-1 overflow-x-auto px-1 pt-1">
                  {aiQuickReplies.map((button) => (
                    <span
                      key={`${button.id}-${button.title}`}
                      className="shrink-0 rounded-full border border-[#d8cbb5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#29384a]"
                    >
                      {button.title}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAiQuickReplies([])}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#54656f] hover:bg-[#d8cbb5]/50"
                    aria-label="Quitar respuestas rápidas"
                    title="Quitar respuestas rápidas"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Toolbar — below textarea, all buttons visible on all screen sizes */}
              <div className="flex items-center gap-0.5 px-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] transition hover:bg-[#d8cbb5]/50 disabled:opacity-40" title="Adjuntar">
                  {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => setShowEmoji((v) => !v)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#d8cbb5]/50 ${showEmoji ? 'bg-[#d8cbb5]/50 text-[#c88b25]' : 'text-[#54656f]'}`}
                  title="Emojis">
                  <Smile className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setShowCatalog(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] transition hover:bg-[#d8cbb5]/50" title="Catálogo de servicios" aria-label="Catálogo">
                  <BookMarked className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setShowWorkflow(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] transition hover:bg-[#d8cbb5]/50" title="Plantillas" aria-label="Plantillas">
                  <ClipboardList className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleAiCompose} disabled={aiLoading}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-40 ${
                    reply.trim() ? 'bg-[#d7a33a]/15 text-[#c88b25] hover:bg-[#d7a33a]/25' : 'text-[#54656f] hover:bg-[#d8cbb5]/50'
                  }`}
                  title={reply.trim() ? 'Mejorar con IA' : 'Generar respuesta IA'} aria-label="IA">
                  {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Full viewport minus admin chrome: 53px top + ~56px bottom nav on mobile */}
      <div className="flex h-[calc(100dvh-133px)] overflow-hidden lg:h-screen lg:max-h-screen">
        {ContactList}
        {ThreadPanel}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewConvModal onClose={() => setShowNewModal(false)} onSent={handleNewConvSent} />
      )}
      {showLinkClient && activeConv && (
        <LinkClientModal
          phone={activeConv.phone}
          onLinked={handleClientLinked}
          onClose={() => setShowLinkClient(false)}
        />
      )}
      {showWorkflow && activeConv && (
        <WaServiceWorkflow
          clientName={activeConv.clientName ?? ''}
          onInsert={(text) => { setReply(text); setAiQuickReplies([]); setTimeout(() => textareaRef.current?.focus(), 50); }}
          onClose={() => setShowWorkflow(false)}
        />
      )}
      {showCatalog && activeConv && (
        <CatalogModal
          phone={activeConv.phone}
          onClose={() => setShowCatalog(false)}
          onSent={(preview) => {
            const newMsg: WaMessage = {
              id: crypto.randomUUID(), direction: 'outbound', body: preview,
              created_at: new Date().toISOString(), needs_review: false, ai_responded: false,
              read_at: null, media_url: null, media_type: null, case_id: null, case: null,
              reply_to_message_id: null, reply_to_whatsapp_message_id: null,
              quoted_body_snapshot: null, quoted_direction: null, quoted_created_at: null,
            };
            setConversations((prev) => prev.map((c) =>
              c.phone !== activeConv.phone ? c : {
                ...c, messages: [...c.messages, newMsg], lastAt: newMsg.created_at,
              }
            ));
          }}
        />
      )}

      {/* Toast */}
      {inboxToast && (
        <div className={`fixed bottom-20 right-4 z-[100] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl lg:bottom-6 lg:right-6 ${
          inboxToast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {inboxToast.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {inboxToast.msg}
        </div>
      )}
    </>
  );
}
