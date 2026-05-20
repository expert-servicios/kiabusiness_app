'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, AlertTriangle, CheckCheck, Phone, ArrowLeft,
  RefreshCw, Plus, Paperclip, Sparkles, X, FileText, Image as ImageIcon,
  FolderOpen, ChevronDown, Smile, UserPlus, Search, BookMarked, Check
} from 'lucide-react';
import { SERVICES_CATALOG, type CatalogSection } from '@/lib/data/services-catalog';
import Link from 'next/link';
import { WaTemplateModal } from './WaTemplateModal';

// ── Emoji picker ──────────────────────────────────────────────
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

// ── Link / Create contact modal ───────────────────────────────
function LinkClientModal({ phone, onLinked, onClose }: {
  phone: string;
  onLinked: (client: { id: string; full_name: string | null; email: string }) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'search' | 'create'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; full_name: string | null; email: string; phone: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  // Create form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'search' || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/whatsapp/link-client?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.clients ?? []);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, tab]);

  const link = async (clientId: string) => {
    setLinking(true);
    try {
      const res = await fetch('/api/admin/whatsapp/link-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, clientId, savePhone: true }),
      });
      const data = await res.json();
      if (res.ok && data.client) onLinked(data.client);
    } finally { setLinking(false); }
  };

  const create = async () => {
    if (!newName.trim()) return;
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
      if (data.client) onLinked(data.client);
    } catch {
      setCreateError('Error de conexión');
    } finally {
      setCreating(false);
    }
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

        {/* Tabs */}
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
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
              {loading && <p className="py-3 text-center text-xs text-[#29384a]">Buscando…</p>}
              {!loading && query.length >= 2 && results.length === 0 && (
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
                    {(c.full_name ?? c.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#07111d]">{c.full_name ?? '—'}</p>
                    <p className="truncate text-xs text-[#29384a]">{c.email}</p>
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
              <label className="mb-1 block text-xs font-semibold text-[#07111d]">Email (opcional)</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#25D366]"
              />
            </div>
            <p className="text-[10px] text-[#29384a]">
              Teléfono: <strong>{phone}</strong> · Se creará una cuenta de cliente vinculada a este número.
            </p>
            {createError && <p className="text-xs text-red-600">{createError}</p>}
            <button
              type="button"
              onClick={create}
              disabled={creating || !newName.trim()}
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
  case_id: string | null;
  case: WaCase | null;
}

interface Conversation {
  phone: string;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
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

function Avatar({ name }: { name: string | null }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 text-sm font-bold text-[#1a9e4a]">
      {initials}
    </div>
  );
}

function MediaPreview({ url, type }: { url: string; type: string }) {
  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Imagen adjunta" className="mt-1 max-h-48 max-w-full rounded-xl object-cover" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white/80 px-3 py-2 text-xs font-semibold text-[#07111d] hover:bg-white"
    >
      <FileText className="h-4 w-4 text-[#c88b25]" />
      Ver documento
    </a>
  );
}

// New conversation modal: free-form or template
function NewConvModal({
  onClose,
  onSent,
}: {
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
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar');
        return;
      }
      onSent(phone.trim(), text.trim());
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSending(false);
    }
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
              Si ya hay conversación activa, puedes enviar texto libre.
            </p>
            <button
              type="button"
              onClick={() => setMode('template')}
              className="flex w-full items-center gap-3 rounded-xl border border-[#d8cbb5] p-4 text-left transition hover:border-[#25D366] hover:bg-[#f9fff9]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#1a9e4a]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#07111d]">Usar plantilla aprobada</p>
                <p className="text-xs text-[#29384a]">Recomendado para iniciar conversación</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('freeform')}
              className="flex w-full items-center gap-3 rounded-xl border border-[#d8cbb5] p-4 text-left transition hover:border-[#25D366] hover:bg-[#f9fff9]"
            >
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
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="34612345678"
                className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#25D366]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#07111d]">Mensaje</label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe el mensaje..."
                className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#25D366]"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="button"
              onClick={sendFreeform}
              disabled={sending || !phone.trim() || !text.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:bg-[#1da851] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </div>
        )}

        {mode === 'template' && (
          <WaTemplateModal
            embedded
            onClose={onClose}
            onSent={onSent}
          />
        )}
      </div>
    </div>
  );
}

// Case assignment dropdown
function CaseAssign({
  clientId,
  currentCaseId,
  phone,
  onAssigned,
}: {
  clientId: string;
  currentCaseId: string | null;
  phone: string;
  onAssigned: (caseId: string | null) => void;
}) {
  const [cases, setCases] = useState<WaCase[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || cases.length > 0) return;
    setLoading(true);
    fetch(`/api/admin/cases?clientId=${clientId}&limit=20`)
      .then((r) => r.json())
      .then((d) => setCases(d.cases ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, clientId, cases.length]);

  const assign = async (caseId: string | null) => {
    setOpen(false);
    await fetch('/api/admin/whatsapp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, caseId }),
    });
    onAssigned(caseId);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg border border-[#d8cbb5] bg-white px-2.5 py-1 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
      >
        <FolderOpen className="h-3 w-3" />
        {currentCaseId ? 'Expediente asignado' : 'Asignar expediente'}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-[#d8cbb5] bg-white shadow-xl">
          <div className="border-b border-[#f0e9d8] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#29384a]">
            Expedientes del cliente
          </div>
          {loading && <p className="px-3 py-3 text-xs text-[#29384a]">Cargando…</p>}
          {!loading && cases.length === 0 && (
            <p className="px-3 py-3 text-xs text-[#29384a]">Sin expedientes</p>
          )}
          {currentCaseId && (
            <button
              type="button"
              onClick={() => assign(null)}
              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
            >
              ✕ Desasignar expediente
            </button>
          )}
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => assign(c.id)}
              className={`w-full px-3 py-2.5 text-left transition hover:bg-[#faf8f2] ${c.id === currentCaseId ? 'bg-[#fdf7e9]' : ''}`}
            >
              <p className="text-xs font-semibold text-[#07111d]">{c.service}</p>
              <p className="text-[10px] text-[#29384a]">{c.state}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Service catalog modal ─────────────────────────────────────
function CatalogModal({ phone, onClose, onSent }: {
  phone: string;
  onClose: () => void;
  onSent: (preview: string) => void;
}) {
  const [mode, setMode] = useState<'list' | 'cards'>('list');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(SERVICES_CATALOG.map((s) => s.id))
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const totalRows = SERVICES_CATALOG
    .filter((s) => selected.has(s.id))
    .reduce((n, s) => n + s.services.length, 0);

  const send = async () => {
    if (selected.size === 0) return;
    setSending(true);
    setError(null);
    const endpoint = mode === 'cards'
      ? '/api/admin/whatsapp/catalog-cards'
      : '/api/admin/whatsapp/catalog';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, sectionIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); return; }
      const names = SERVICES_CATALOG
        .filter((s) => selected.has(s.id))
        .map((s) => `${s.emoji} ${s.title}`)
        .join(', ');
      onSent(mode === 'cards' ? `[Tarjetas] ${names}` : `[Catálogo] ${names}`);
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
          <div>
            <p className="font-semibold text-[#07111d]">Catálogo de servicios</p>
            <p className="text-xs text-[#29384a]">
              {selected.size > 0
                ? `${selected.size} sección${selected.size > 1 ? 'es' : ''} · ${Math.min(totalRows, 10)} servicios`
                : 'Selecciona al menos una sección'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f0e9d8]">
            <X className="h-4 w-4 text-[#29384a]" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 px-4 pt-3">
          {(['list', 'cards'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                mode === m
                  ? 'bg-[#25D366] text-white'
                  : 'bg-[#f0e9d8] text-[#29384a] hover:bg-[#e8deca]'
              }`}
            >
              {m === 'list' ? '📋 Lista interactiva' : '🖼️ Tarjetas visuales'}
            </button>
          ))}
        </div>
        {mode === 'cards' && (
          <p className="px-4 pt-1.5 text-[10px] text-[#29384a]">
            Envía una tarjeta con imagen + botones por cada sección. Las imágenes deben estar en /public/catalog/.
          </p>
        )}

        {/* Sections */}
        <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2">
          {SERVICES_CATALOG.map((section: CatalogSection) => {
            const on = selected.has(section.id);
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => toggle(section.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  on
                    ? 'border-[#25D366] bg-[#f0fff5]'
                    : 'border-[#d8cbb5] bg-white hover:border-[#25D366]/50 hover:bg-[#f9fff9]'
                }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  on ? 'border-[#25D366] bg-[#25D366]' : 'border-[#d8cbb5]'
                }`}>
                  {on && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#07111d]">{section.emoji} {section.title}</p>
                  <p className="mt-0.5 text-xs text-[#29384a]">
                    {section.services.map((s) => s.title).join(' · ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0e9d8] px-4 py-3 space-y-2">
          {mode === 'list' && totalRows > 10 && (
            <p className="text-[10px] text-amber-600">
              WhatsApp permite máx. 10 servicios en lista. Se enviarán los primeros 10.
            </p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={send}
            disabled={sending || selected.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:bg-[#1da851] disabled:opacity-50"
          >
            <BookMarked className="h-4 w-4" />
            {sending ? 'Enviando…' : mode === 'cards' ? 'Enviar tarjetas visuales' : 'Enviar catálogo lista'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppInbox({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; waType: string; filename: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLinkClient, setShowLinkClient] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
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
    setPendingFile(null);
    // Mark as read
    fetch('/api/admin/whatsapp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, markRead: true }),
    }).catch(() => {});
    setConversations((prev) => prev.map((c) =>
      c.phone === phone ? { ...c, unread: 0, needsReview: false } : c
    ));
  };

  // File upload
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

  // AI compose
  const handleAiCompose = async () => {
    if (!activeConv) return;
    const hasText = Boolean(reply.trim());
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/ai-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeConv.clientId,
          phone: activeConv.phone,
          history: activeConv.messages.slice(-10).map((m) => ({ direction: m.direction, body: m.body })),
          intent: reply.trim() || undefined,
          mode: hasText ? 'edit' : 'compose',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error IA'); return; }
      setReply(data.draft ?? '');
      textareaRef.current?.focus();
    } catch {
      setError('Error al generar borrador.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    const text = reply.trim();
    if ((!text && !pendingFile) || !selected) return;
    setSending(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { phone: selected };
      if (pendingFile) {
        payload.mediaUrl  = pendingFile.url;
        payload.mediaType = pendingFile.waType;
        payload.mediaFilename = pendingFile.filename;
        if (text) payload.caption = text;
      } else {
        payload.body = text;
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
        body: pendingFile ? (text || `[${pendingFile.waType}]`) : text,
        created_at: new Date().toISOString(),
        needs_review: false,
        ai_responded: false,
        read_at: null,
        media_url: pendingFile?.url ?? null,
        media_type: pendingFile?.waType ?? null,
        case_id: null,
        case: null,
      };

      setConversations((prev) => prev.map((c) => {
        if (c.phone !== selected) return c;
        return {
          ...c,
          unread: 0,
          needsReview: false,
          messages: [...c.messages.map((m) => ({ ...m, needs_review: false })), newMsg],
          lastAt: newMsg.created_at,
        };
      }));
      setReply('');
      setPendingFile(null);
      textareaRef.current?.focus();
    } catch {
      setError('Error de conexión.');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) { setReply((r) => r + emoji); return; }
    const start = el.selectionStart ?? reply.length;
    const end   = el.selectionEnd   ?? reply.length;
    const next  = reply.slice(0, start) + emoji + reply.slice(end);
    setReply(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const handleClientLinked = (client: { id: string; full_name: string | null; email: string }) => {
    if (!selected) return;
    setConversations((prev) => prev.map((c) =>
      c.phone !== selected ? c : { ...c, clientId: client.id, clientName: client.full_name, clientEmail: client.email }
    ));
    setShowLinkClient(false);
  };

  const handleNewConvSent = useCallback((phone: string, previewText: string) => {
    const normalized = phone.replace(/\D/g, '');
    setConversations((prev) => {
      const exists = prev.find((c) => c.phone === normalized);
      const newMsg: WaMessage = {
        id: crypto.randomUUID(),
        direction: 'outbound',
        body: previewText,
        created_at: new Date().toISOString(),
        needs_review: false,
        ai_responded: false,
        read_at: null,
        media_url: null,
        media_type: null,
        case_id: null,
        case: null,
      };
      if (exists) {
        return prev.map((c) => c.phone !== normalized ? c : {
          ...c,
          messages: [...c.messages, newMsg],
          lastAt: newMsg.created_at,
        });
      }
      return [{
        phone: normalized,
        clientId: null,
        clientName: null,
        clientEmail: null,
        messages: [newMsg],
        unread: 0,
        needsReview: false,
        lastAt: newMsg.created_at,
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
        ...c,
        messages: c.messages.map((m) => ({ ...m, case_id: caseId, case: null })),
      }
    ));
  };

  const totalUnread  = conversations.reduce((s, c) => s + c.unread, 0);
  const totalReview  = conversations.filter((c) => c.needsReview).length;
  const currentCaseId = activeConv?.messages.findLast((m) => m.case_id)?.case_id ?? null;

  // ── Contact list ──────────────────────────────────────────────
  const ContactList = (
    <aside className={`flex flex-col bg-white ${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 lg:shrink-0 lg:border-r lg:border-[#d8cbb5]`}>
      <div className="flex items-center justify-between border-b border-[#d8cbb5] px-4 py-3">
        <div>
          <h1 className="font-serif text-base font-bold text-[#07111d]">WhatsApp</h1>
          <p className="mt-0.5 text-xs text-[#29384a]">
            {totalUnread > 0 && <span className="font-semibold text-[#c88b25]">{totalUnread} sin leer · </span>}
            {totalReview > 0 && <span className="font-semibold text-red-600">{totalReview} revisión · </span>}
            {conversations.length} conversaciones
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white transition hover:bg-[#1da851]"
            title="Nueva conversación"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8] disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <ul className="flex-1 divide-y divide-[#f0e9d8] overflow-y-auto">
        {conversations.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-[#29384a]">
            Sin conversaciones aún.<br />
            <span className="text-xs text-[#29384a]/60">Los mensajes aparecerán aquí.</span>
          </li>
        )}
        {conversations.map((conv) => (
          <li key={conv.phone}>
            <button
              type="button"
              onClick={() => handleSelectConversation(conv.phone)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-[#f0e9d8] ${
                selected === conv.phone ? 'bg-[#faf8f2]' : 'hover:bg-[#faf8f2]'
              }`}
            >
              <Avatar name={conv.clientName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <p className="truncate text-sm font-semibold text-[#07111d]">
                    {conv.clientName ?? conv.phone}
                  </p>
                  <span className="shrink-0 text-[10px] text-[#29384a]/60">{fmtTime(conv.lastAt)}</span>
                </div>
                {conv.clientName && <p className="text-xs text-[#29384a]/60">{conv.phone}</p>}
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-[#29384a]">{conv.messages.at(-1)?.body ?? ''}</p>
                  <div className="flex shrink-0 gap-1">
                    {conv.needsReview && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">REVISAR</span>
                    )}
                    {conv.unread > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#25D366] px-1 text-[9px] font-bold text-white">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );

  // ── Thread panel ──────────────────────────────────────────────
  const ThreadPanel = (
    <div className={`flex flex-col bg-[#ece5dd] ${selected ? 'flex' : 'hidden lg:flex'} flex-1 min-w-0 min-h-0`}>
      {!activeConv ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[#29384a]/60">
          <Phone className="h-10 w-10 text-[#d8cbb5]" />
          <p>Selecciona una conversación</p>
        </div>
      ) : (
        <>
          {/* Thread header */}
          <div className="flex items-center gap-2 border-b border-black/10 bg-[#075e54] px-3 py-2.5 sm:px-4">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 lg:hidden"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Avatar name={activeConv.clientName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {activeConv.clientName ?? activeConv.phone}
              </p>
              <p className="truncate text-xs text-white/70">
                {activeConv.clientName ? activeConv.phone : null}
                {activeConv.clientId && (
                  <> · <Link href={`/admin/clientes/${activeConv.clientId}`} className="underline">ficha</Link></>
                )}
              </p>
            </div>
            {/* Actions — collapsed on very small screens */}
            <div className="flex shrink-0 items-center gap-1">
              {activeConv.needsReview && (
                <span className="hidden items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-200 sm:flex">
                  <AlertTriangle className="h-3 w-3" /> REVISAR
                </span>
              )}
              {activeConv.needsReview && (
                <span title="Necesita revisión"><AlertTriangle className="h-4 w-4 text-red-300 sm:hidden" /></span>
              )}
              {!activeConv.clientId && (
                <button
                  type="button"
                  onClick={() => setShowLinkClient(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/80 transition hover:bg-white/20 sm:h-auto sm:w-auto sm:gap-1 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[10px] sm:font-bold"
                  title="Vincular cliente"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vincular</span>
                </button>
              )}
              {activeConv.clientId && (
                <CaseAssign
                  clientId={activeConv.clientId}
                  currentCaseId={currentCaseId}
                  phone={activeConv.phone}
                  onAssigned={handleCaseAssigned}
                />
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {activeConv.messages.map((msg, i) => {
              const isOut = msg.direction === 'outbound';
              const prev = activeConv.messages[i - 1];
              const showTime = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;

              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="my-2 text-center">
                      <span className="rounded-full bg-black/10 px-3 py-1 text-[10px] text-[#29384a]">
                        {fmtTime(msg.created_at)}
                      </span>
                    </div>
                  )}
                  {msg.case && (
                    <div className={`mb-1 flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <span className="flex items-center gap-1 rounded-full bg-[#c88b25]/15 px-2 py-0.5 text-[10px] font-semibold text-[#c88b25]">
                        <FolderOpen className="h-2.5 w-2.5" /> {msg.case.service}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[88%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      isOut
                        ? 'rounded-tr-sm bg-[#dcf8c6] text-[#07111d]'
                        : msg.needs_review
                          ? 'rounded-tl-sm border border-red-200 bg-red-50 text-[#07111d]'
                          : 'rounded-tl-sm bg-white text-[#07111d]'
                    }`}>
                      {msg.media_url && msg.media_type && (
                        <MediaPreview url={msg.media_url} type={msg.media_type} />
                      )}
                      {msg.body && <p className="mt-1 whitespace-pre-wrap break-words">{msg.body}</p>}
                      <div className={`mt-1 flex items-center gap-1 text-[10px] text-[#29384a]/60 ${isOut ? 'justify-end' : 'justify-start'}`}>
                        {isOut && msg.ai_responded && <Bot className="h-3 w-3" />}
                        {isOut && !msg.ai_responded && <User className="h-3 w-3" />}
                        <span>{fmtTime(msg.created_at)}</span>
                        {isOut && <CheckCheck className="h-3 w-3 text-[#25D366]" />}
                      </div>
                    </div>
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
            <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Reply box */}
          <div className="relative border-t border-black/10 bg-[#f0f2f5] px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))] sm:px-3">
            {showEmoji && (
              <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
            )}
            <div className="flex items-end gap-1 sm:gap-2">
              {/* Attach */}
              <input
                ref={fileInputRef}
                type="file"
                aria-label="Seleccionar archivo adjunto"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,audio/ogg,audio/mpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#29384a] transition hover:bg-[#d8cbb5]/50 disabled:opacity-40"
                title="Adjuntar archivo"
              >
                {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>

              {/* Emoji — oculto en móvil muy pequeño para dar espacio */}
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[#d8cbb5]/50 ${showEmoji ? 'bg-[#d8cbb5]/50 text-[#c88b25]' : 'text-[#29384a]'}`}
                title="Emojis"
              >
                <Smile className="h-4 w-4" />
              </button>

              {/* Catalog */}
              <button
                type="button"
                onClick={() => setShowCatalog(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#29384a] transition hover:bg-[#d8cbb5]/50"
                title="Enviar catálogo de servicios"
                aria-label="Enviar catálogo de servicios"
              >
                <BookMarked className="h-4 w-4" />
              </button>

              {/* AI compose / edit+translate */}
              <button
                type="button"
                onClick={handleAiCompose}
                disabled={aiLoading}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
                  reply.trim()
                    ? 'bg-[#d7a33a]/15 text-[#c88b25] hover:bg-[#d7a33a]/25'
                    : 'text-[#29384a] hover:bg-[#d8cbb5]/50'
                }`}
                title={reply.trim() ? 'Mejorar y traducir con IA' : 'Generar respuesta con IA'}
                aria-label={reply.trim() ? 'Mejorar y traducir con IA' : 'Generar respuesta con IA'}
              >
                {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </button>

              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={handleKey}
                placeholder={pendingFile ? 'Añadir texto al adjunto (opcional)' : 'Escribe un mensaje'}
                rows={1}
                className="min-h-[44px] flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-3 text-[16px] leading-snug text-[#07111d] outline-none placeholder:text-[#29384a]/50 sm:text-sm sm:py-2.5"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (!reply.trim() && !pendingFile)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow transition hover:bg-[#1da851] disabled:opacity-50 active:scale-95"
                aria-label="Enviar"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="flex h-[calc(100dvh-133px)] overflow-hidden lg:h-screen">
        {ContactList}
        {ThreadPanel}
      </div>
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
      {showCatalog && activeConv && (
        <CatalogModal
          phone={activeConv.phone}
          onClose={() => setShowCatalog(false)}
          onSent={(preview) => {
            const newMsg: WaMessage = {
              id: crypto.randomUUID(),
              direction: 'outbound',
              body: preview,
              created_at: new Date().toISOString(),
              needs_review: false,
              ai_responded: false,
              read_at: null,
              media_url: null,
              media_type: null,
              case_id: null,
              case: null,
            };
            setConversations((prev) => prev.map((c) =>
              c.phone !== activeConv.phone ? c : {
                ...c, messages: [...c.messages, newMsg], lastAt: newMsg.created_at,
              }
            ));
          }}
        />
      )}
    </>
  );
}
