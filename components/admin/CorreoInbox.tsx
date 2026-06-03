'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, RefreshCw, ArrowLeft, Send, Link2, Search, X, Check, PenSquare, Sparkles } from 'lucide-react';

interface MailSummary {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  date: string;
  unread: boolean;
  hasAttachment: boolean;
}

interface MailMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  bodyType: 'html' | 'text';
  unread: boolean;
}

interface Case {
  id: string;
  service: string;
  client: { full_name: string | null; email: string };
}

type Provider = 'ms365' | 'gmail';

const MONTH = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtDate(str: string) {
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }
  return `${d.getDate()} ${MONTH[d.getMonth()]}`;
}

function initials(from: string) {
  const name = from.split('<')[0].trim() || from;
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

interface Props {
  ms365Connected: boolean;
  ms365Email: string | null;
  gmailConnected: boolean;
  gmailEmail: string | null;
  gmailSA?: boolean;
  initialMails: MailSummary[];
  initialProvider: Provider;
  errorParam?: string | null;
  connectedParam?: string | null;
}

export function CorreoInbox({
  ms365Connected,
  ms365Email,
  gmailConnected,
  gmailEmail,
  gmailSA = false,
  initialMails,
  initialProvider,
  errorParam,
  connectedParam,
}: Props) {
  const [provider, setProvider] = useState<Provider>(initialProvider);
  const [mails, setMails] = useState<MailSummary[]>(initialMails);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<MailMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [linkedCaseId, setLinkedCaseId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [caseSearch, setCaseSearch] = useState('');
  const [linking, setLinking] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [suggestingAI, setSuggestingAI] = useState(false);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeTopic, setComposeTopic] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeKiaLoading, setComposeKiaLoading] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  const activeEmail = provider === 'gmail' ? gmailEmail : ms365Email;
  const activeConnected = provider === 'gmail' ? gmailConnected : ms365Connected;
  const bothConnected = ms365Connected && gmailConnected;
  const anyConnected = ms365Connected || gmailConnected;

  const selectedSummary = mails.find((m) => m.conversationId === selected);
  const lastMsg = threadMessages.at(-1);

  const loadMails = useCallback(async (prov: Provider, q?: string) => {
    const params = new URLSearchParams({ action: 'list', provider: prov });
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/correo?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMails(data.mails ?? []);
    }
  }, []);

  // Reload mails when switching provider
  useEffect(() => {
    if (!activeConnected) { setMails([]); return; }
    setSelected(null);
    setThreadMessages([]);
    loadMails(provider);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const loadThread = useCallback(async (conversationId: string, prov: Provider) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/correo?action=conversation&conversationId=${encodeURIComponent(conversationId)}&provider=${prov}`);
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data.messages ?? []);
        setLinkedCaseId(data.linkedCaseId ?? null);
        const last = (data.messages ?? []).at(-1);
        if (last) setSelectedMailId(last.id);
      }
    } catch { /* silent */ }
    setLoadingThread(false);
  }, []);

  const handleSelect = useCallback((conversationId: string) => {
    setSelected(conversationId);
    setSendError(null);
    setReply('');
    setMails((prev) => prev.map((m) => m.conversationId === conversationId ? { ...m, unread: false } : m));
    loadThread(conversationId, provider);
  }, [loadThread, provider]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMails(provider, searchInput.trim() || undefined);
    setRefreshing(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshing(true);
    await loadMails(provider, searchInput.trim() || undefined);
    setRefreshing(false);
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedMailId || !selected) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/admin/correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:         'reply',
          provider,
          messageId:      selectedMailId,
          comment:        reply.trim(),
          conversationId: selected,
          subject:        lastMsg?.subject,
          clientEmail:    lastMsg?.fromEmail,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSendError(d.error ?? 'Error al enviar');
        return;
      }
      setThreadMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        conversationId: selected,
        subject:   lastMsg?.subject ?? '',
        from:      activeEmail ?? 'admin',
        fromEmail: activeEmail ?? '',
        to:        lastMsg?.fromEmail ?? '',
        date:      new Date().toISOString(),
        body:      reply.trim(),
        bodyType:  'text' as const,
        unread:    false,
      }]);
      setReply('');
    } catch {
      setSendError('Error de conexión.');
    } finally {
      setSending(false);
    }
  };

  const handleKiaDraft = async () => {
    setComposeKiaLoading(true);
    setComposeError(null);
    try {
      const res = await fetch('/api/admin/correo/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compose: true,
          composeTo: composeTo.trim() || undefined,
          composeTopic: composeTopic.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subject && !composeSubject) setComposeSubject(data.subject);
        if (data.suggestion) setComposeBody(data.suggestion);
      }
    } catch { /* silent */ }
    setComposeKiaLoading(false);
  };

  const handleSendCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;
    setComposeSending(true);
    setComposeError(null);
    try {
      const res = await fetch('/api/admin/correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:   'compose',
          provider,
          to:       composeTo.trim(),
          subject:  composeSubject.trim(),
          body:     composeBody.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setComposeError(d.error ?? 'Error al enviar');
        return;
      }
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setComposeTopic('');
    } catch {
      setComposeError('Error de conexión.');
    } finally {
      setComposeSending(false);
    }
  };

  const openLinkModal = async () => {
    setShowLinkModal(true);
    if (cases.length === 0) {
      const res = await fetch('/api/admin/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases ?? []);
      }
    }
  };

  const handleSuggestAI = async () => {
    if (!selectedSummary || threadMessages.length === 0) return;
    setSuggestingAI(true);
    try {
      const res = await fetch('/api/admin/correo/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSummary.subject, messages: threadMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) setReply(data.suggestion);
      }
    } catch { /* silent */ }
    setSuggestingAI(false);
  };

  const handleLink = async (caseId: string | null) => {
    if (!selected || !selectedSummary) return;
    setLinking(true);
    try {
      await fetch('/api/admin/correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:         'link',
          conversationId: selected,
          caseId,
          subject:        selectedSummary.subject,
          clientEmail:    selectedSummary.fromEmail,
        }),
      });
      setLinkedCaseId(caseId);
      setShowLinkModal(false);
    } catch { /* silent */ }
    setLinking(false);
  };

  const filteredCases = cases.filter((c) =>
    !caseSearch ||
    c.service?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.client?.full_name?.toLowerCase().includes(caseSearch.toLowerCase())
  );

  // ── Not connected at all ───────────────────────────────────────
  if (!anyConnected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-blue-50 p-5">
          <Mail className="h-10 w-10 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#07111d]">Conecta tu cuenta de correo</h2>
          <p className="mt-1 max-w-xs text-sm text-[#29384a]">
            Gestiona correos de clientes y asócialos a sus expedientes, todo sin salir del panel.
          </p>
          {errorParam && (
            <p className="mt-2 text-xs text-red-600">
              {errorParam === 'oauth_denied' ? 'Acceso denegado.' : 'Error al conectar. Inténtalo de nuevo.'}
            </p>
          )}
          {connectedParam && (
            <p className="mt-2 text-xs text-green-700">Cuenta conectada correctamente.</p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/api/auth/google-gmail"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb5] bg-white px-5 py-2.5 text-sm font-bold text-[#07111d] transition hover:border-[#c88b25]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Conectar Gmail
          </a>
          <a
            href="/api/auth/ms365"
            className="inline-flex items-center gap-2 rounded-full bg-[#07111d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2a3a]"
          >
            Conectar Microsoft 365
          </a>
        </div>
        <p className="text-xs text-[#29384a]/50">
          Solo permisos de lectura y envío de correo.
        </p>
      </div>
    );
  }

  // ── Provider tabs (shown when both connected or to add second) ─
  const ProviderBar = (
    <div className="flex items-center gap-1 border-b border-[#d8cbb5] bg-white px-4 py-2">
      {gmailConnected && (
        <button
          type="button"
          onClick={() => setProvider('gmail')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
            provider === 'gmail'
              ? 'bg-[#07111d] text-white'
              : 'text-[#29384a] hover:bg-[#f0e9d8]'
          }`}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" aria-hidden="true">
            <path fill={provider === 'gmail' ? '#fff' : '#EA4335'} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill={provider === 'gmail' ? '#ccc' : '#34A853'} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill={provider === 'gmail' ? '#aaa' : '#FBBC05'} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill={provider === 'gmail' ? '#aaa' : '#EA4335'} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Gmail
        </button>
      )}
      {ms365Connected && (
        <button
          type="button"
          onClick={() => setProvider('ms365')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
            provider === 'ms365'
              ? 'bg-[#07111d] text-white'
              : 'text-[#29384a] hover:bg-[#f0e9d8]'
          }`}
        >
          <span className="text-[10px]">🏢</span> Outlook
        </button>
      )}
      <div className="ml-auto flex gap-2">
        {!gmailConnected && (
          <a href="/api/auth/google-gmail" className="text-[10px] font-semibold text-[#c88b25] hover:underline">
            + Gmail
          </a>
        )}
        {!ms365Connected && (
          <a href="/api/auth/ms365" className="text-[10px] font-semibold text-[#c88b25] hover:underline">
            + Outlook
          </a>
        )}
      </div>
    </div>
  );

  // ── Selected provider not connected ───────────────────────────
  if (!activeConnected) {
    return (
      <div className="flex flex-col h-full">
        {bothConnected || true ? ProviderBar : null}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <Mail className="h-10 w-10 text-[#d8cbb5]" />
          <p className="text-sm text-[#29384a]">
            {provider === 'gmail' ? 'Gmail no conectado.' : 'Microsoft 365 no conectado.'}
          </p>
          <a
            href={provider === 'gmail' ? '/api/auth/google-gmail' : '/api/auth/ms365'}
            className="rounded-full bg-[#07111d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2a3a]"
          >
            Conectar {provider === 'gmail' ? 'Gmail' : 'Microsoft 365'}
          </a>
        </div>
      </div>
    );
  }

  // ── Email list panel ──────────────────────────────────────────
  const MailList = (
    <aside className={`flex flex-col bg-white border-r border-[#d8cbb5]
      ${selected ? 'hidden lg:flex' : 'flex'}
      w-full lg:w-80 lg:shrink-0`}
    >
      <div className="border-b border-[#d8cbb5] px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-base font-bold text-[#07111d]">Correo</h1>
            <p className="max-w-[140px] truncate text-[10px] text-[#29384a]/60">{activeEmail}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setShowCompose(true); setComposeError(null); }}
              className="flex items-center gap-1 rounded-lg bg-[#07111d] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a2a3a]"
              title="Nuevo correo"
            >
              <PenSquare className="h-3.5 w-3.5" />
              Nuevo
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
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar correos..."
            className="flex-1 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs outline-none focus:border-[#c88b25]"
          />
          <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#07111d] text-white">
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      <ul className="flex-1 divide-y divide-[#f0e9d8] overflow-y-auto">
        {mails.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-[#29384a]">Sin correos en la bandeja.</li>
        )}
        {mails.map((mail) => (
          <li key={mail.id}>
            <button
              type="button"
              onClick={() => handleSelect(mail.conversationId)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-[#f0e9d8] ${
                selected === mail.conversationId ? 'bg-[#faf8f2]' : 'hover:bg-[#faf8f2]'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {initials(mail.from)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <p className={`truncate text-sm ${mail.unread ? 'font-bold' : 'font-medium'} text-[#07111d]`}>
                    {mail.from || mail.fromEmail}
                  </p>
                  <span className="shrink-0 text-[10px] text-[#29384a]/60">{fmtDate(mail.date)}</span>
                </div>
                <p className={`truncate text-xs ${mail.unread ? 'font-semibold text-[#07111d]' : 'text-[#29384a]'}`}>
                  {mail.subject}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#29384a]/60">{mail.snippet}</p>
              </div>
              {mail.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
            </button>
          </li>
        ))}
      </ul>

      {!(provider === 'gmail' && gmailSA) && (
        <div className="border-t border-[#d8cbb5] px-4 py-2.5">
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`¿Desconectar la cuenta de ${provider === 'gmail' ? 'Gmail' : 'Microsoft 365'}?`)) return;
              await fetch(`/api/admin/correo?provider=${provider}`, { method: 'DELETE' });
              location.reload();
            }}
            className="text-xs text-[#29384a]/50 transition hover:text-red-600"
          >
            Desconectar cuenta
          </button>
        </div>
      )}
    </aside>
  );

  // ── Thread panel ──────────────────────────────────────────────
  const ThreadPanel = (
    <div className={`flex flex-col bg-[#faf8f2]
      ${selected ? 'flex' : 'hidden lg:flex'}
      flex-1 min-w-0 min-h-0`}
    >
      {!selected || !selectedSummary ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[#29384a]/60">
          <Mail className="h-10 w-10 text-[#d8cbb5]" />
          <p>Selecciona un correo</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-[#d8cbb5] bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#29384a] transition hover:bg-[#f0e9d8] lg:hidden"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#07111d]">{selectedSummary.subject}</p>
              <p className="truncate text-xs text-[#29384a]/60">{selectedSummary.from}</p>
            </div>
            <div className="shrink-0">
              {linkedCaseId ? (
                <button
                  type="button"
                  onClick={openLinkModal}
                  className="flex items-center gap-1 rounded-full bg-[#D4A017]/15 px-2.5 py-1 text-[10px] font-semibold text-[#c88b25] transition hover:bg-[#D4A017]/25"
                >
                  <Link2 className="h-3 w-3" /> Asociado
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLinkModal}
                  className="flex items-center gap-1 rounded-full border border-[#d8cbb5] px-2.5 py-1 text-[10px] font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#c88b25]"
                >
                  <Link2 className="h-3 w-3" /> Asociar
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
            {loadingThread ? (
              <p className="pt-8 text-center text-sm text-[#29384a]/60">Cargando conversación...</p>
            ) : threadMessages.map((msg) => {
              const isOwn = msg.fromEmail === activeEmail;
              return (
                <div key={msg.id} className={`rounded-xl border p-4 ${
                  isOwn ? 'border-[#D4A017]/20 bg-[#D4A017]/5' : 'border-[#d8cbb5] bg-white'
                }`}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#07111d]">{msg.from || msg.fromEmail}</p>
                      <p className="text-[10px] text-[#29384a]/60">Para: {msg.to}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#29384a]/50">{fmtDate(msg.date)}</span>
                  </div>
                  {msg.bodyType === 'html' ? (
                    <div
                      className="max-w-none overflow-auto text-xs leading-relaxed text-[#07111d]"
                      dangerouslySetInnerHTML={{ __html: msg.body }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#07111d]">{msg.body}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#d8cbb5] bg-white p-4 space-y-3">
            {sendError && <p className="text-xs text-red-600">{sendError}</p>}
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={`Responder a ${lastMsg?.fromEmail ?? ''}...`}
              rows={3}
              className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-3 text-sm outline-none focus:border-[#c88b25]"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSuggestAI}
                disabled={suggestingAI || loadingThread || threadMessages.length === 0}
                className="flex items-center gap-1.5 rounded-full border border-[#c88b25] px-4 py-2 text-sm font-semibold text-[#c88b25] transition hover:bg-[#c88b25]/10 disabled:opacity-40"
                title="Sugerir respuesta con IA"
              >
                <span className="text-base leading-none">✦</span>
                {suggestingAI ? 'Generando...' : 'Sugerir IA'}
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                disabled={sending || !reply.trim() || !selectedMailId}
                className="flex items-center gap-2 rounded-full bg-[#07111d] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1a2a3a] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-3rem)] lg:h-screen overflow-hidden">
        {ProviderBar}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {MailList}
          {ThreadPanel}
        </div>
      </div>

      {showCompose && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowCompose(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
              <div className="flex items-center gap-2">
                <PenSquare className="h-4 w-4 text-[#c88b25]" />
                <p className="font-semibold text-[#07111d]">Nuevo correo</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e9d8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Kia draft section */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={composeTopic}
                  onChange={(e) => setComposeTopic(e.target.value)}
                  placeholder="Tema o contexto para Kia (opcional)..."
                  className="flex-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                />
                <button
                  type="button"
                  onClick={handleKiaDraft}
                  disabled={composeKiaLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-[#c88b25] px-3 py-2 text-sm font-semibold text-[#c88b25] transition hover:bg-[#c88b25]/10 disabled:opacity-40 whitespace-nowrap"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {composeKiaLoading ? 'Redactando...' : 'Kia redacta'}
                </button>
              </div>

              {/* To */}
              <input
                type="email"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="Para (email del destinatario)"
                className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
              />

              {/* Subject */}
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Asunto"
                className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
              />

              {/* Body */}
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Cuerpo del correo..."
                rows={6}
                className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-3 text-sm outline-none focus:border-[#c88b25]"
              />

              {composeError && <p className="text-xs text-red-600">{composeError}</p>}

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-[#29384a]/50">
                  Enviando desde: {activeEmail}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm font-semibold text-[#29384a] transition hover:bg-[#f0e9d8]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCompose}
                    disabled={composeSending || !composeTo || !composeSubject || !composeBody}
                    className="flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1a2a3a] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {composeSending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowLinkModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
              <p className="font-semibold text-[#07111d]">Asociar a expediente</p>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e9d8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="text"
                placeholder="Buscar expediente o cliente..."
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
              />
              <ul className="max-h-64 divide-y divide-[#f0e9d8] overflow-y-auto rounded-xl border border-[#f0e9d8]">
                {filteredCases.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-[#29384a]/60">Sin resultados</li>
                )}
                {filteredCases.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleLink(c.id)}
                      disabled={linking}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[#faf8f2]"
                    >
                      <div>
                        <p className="font-semibold text-[#07111d]">{c.service}</p>
                        {c.client?.full_name && (
                          <p className="text-xs text-[#29384a]/60">{c.client.full_name}</p>
                        )}
                      </div>
                      {linkedCaseId === c.id && <Check className="h-4 w-4 text-[#1a9e4a]" />}
                    </button>
                  </li>
                ))}
              </ul>
              {linkedCaseId && (
                <button
                  type="button"
                  onClick={() => handleLink(null)}
                  disabled={linking}
                  className="w-full rounded-xl border border-red-200 py-2 text-xs text-red-600 transition hover:bg-red-50"
                >
                  Desasociar expediente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
