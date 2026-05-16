'use client';

import { useState, useCallback } from 'react';
import { Mail, RefreshCw, ArrowLeft, Send, Link2, Search, X, Check } from 'lucide-react';

interface EmailSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  date: string;
  unread: boolean;
  hasAttachment: boolean;
}

interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  unread: boolean;
}

interface Case {
  id: string;
  service: string;
  category: string;
  client: { full_name: string | null; email: string };
}

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
  connected: boolean;
  gmailEmail: string | null;
  initialEmails: EmailSummary[];
}

export function GmailInbox({ connected, gmailEmail, initialEmails }: Props) {
  const [emails, setEmails] = useState<EmailSummary[]>(initialEmails);
  const [selected, setSelected] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<EmailMessage[]>([]);
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
  const [query, setQuery] = useState('in:inbox');

  const selectedEmail = emails.find((e) => e.threadId === selected);
  const lastMsg = threadMessages.at(-1);

  const loadThread = useCallback(async (threadId: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/gmail?action=thread&threadId=${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data.messages ?? []);
        setLinkedCaseId(data.linkedCaseId ?? null);
      }
    } catch { /* silent */ }
    setLoadingThread(false);
  }, []);

  const handleSelect = useCallback((threadId: string) => {
    setSelected(threadId);
    setSendError(null);
    setReply('');
    setEmails((prev) => prev.map((e) => e.threadId === threadId ? { ...e, unread: false } : e));
    loadThread(threadId);
  }, [loadThread]);

  const loadEmails = useCallback(async (q = query) => {
    const res = await fetch(`/api/admin/gmail?action=list&q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setEmails(data.emails ?? []);
    }
  }, [query]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmails();
    setRefreshing(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim() || 'in:inbox';
    setQuery(q);
    setRefreshing(true);
    await loadEmails(q);
    setRefreshing(false);
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !lastMsg || !selected) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/admin/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          to: lastMsg.fromEmail,
          subject: lastMsg.subject,
          body: reply.trim(),
          threadId: selected,
          inReplyTo: lastMsg.id,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSendError(d.error ?? 'Error al enviar');
        return;
      }
      setThreadMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        threadId: selected,
        subject: lastMsg.subject,
        from: gmailEmail ?? 'admin',
        fromEmail: gmailEmail ?? '',
        to: lastMsg.fromEmail,
        date: new Date().toISOString(),
        body: reply.trim(),
        unread: false,
      }]);
      setReply('');
    } catch {
      setSendError('Error de conexión.');
    } finally {
      setSending(false);
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

  const handleLink = async (caseId: string | null) => {
    if (!selected || !selectedEmail) return;
    setLinking(true);
    try {
      await fetch('/api/admin/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link',
          threadId: selected,
          caseId,
          subject: selectedEmail.subject,
          clientEmail: selectedEmail.fromEmail,
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

  if (!connected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-blue-50 p-5">
          <Mail className="h-10 w-10 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#07111d]">Conecta tu cuenta de Gmail</h2>
          <p className="mt-1 text-sm text-[#29384a]">
            Gestiona los correos de clientes y asócialos a sus expedientes.
          </p>
        </div>
        <a
          href="/api/auth/gmail"
          className="rounded-full bg-[#07111d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a2a3a]"
        >
          Conectar Gmail
        </a>
      </div>
    );
  }

  // ── Email list panel ──────────────────────────────────────────
  const EmailList = (
    <aside className={`flex flex-col bg-white border-r border-[#d8cbb5]
      ${selected ? 'hidden lg:flex' : 'flex'}
      w-full lg:w-80 lg:shrink-0`}
    >
      <div className="border-b border-[#d8cbb5] px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-base font-bold text-[#07111d]">Gmail</h1>
            <p className="text-[10px] text-[#29384a]/60 truncate">{gmailEmail}</p>
          </div>
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
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar en Gmail..."
            className="flex-1 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs outline-none focus:border-[#c88b25]"
          />
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#07111d] text-white"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      <ul className="flex-1 divide-y divide-[#f0e9d8] overflow-y-auto">
        {emails.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-[#29384a]">Sin correos.</li>
        )}
        {emails.map((email) => (
          <li key={email.id}>
            <button
              type="button"
              onClick={() => handleSelect(email.threadId)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-[#f0e9d8] ${
                selected === email.threadId ? 'bg-[#faf8f2]' : 'hover:bg-[#faf8f2]'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {initials(email.from)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <p className={`truncate text-sm ${email.unread ? 'font-bold' : 'font-medium'} text-[#07111d]`}>
                    {email.from.split('<')[0].trim() || email.fromEmail}
                  </p>
                  <span className="shrink-0 text-[10px] text-[#29384a]/60">{fmtDate(email.date)}</span>
                </div>
                <p className={`truncate text-xs ${email.unread ? 'font-semibold text-[#07111d]' : 'text-[#29384a]'}`}>
                  {email.subject}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#29384a]/60">{email.snippet}</p>
              </div>
              {email.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-[#d8cbb5] px-4 py-2.5">
        <button
          type="button"
          onClick={async () => {
            if (!confirm('¿Desconectar la cuenta de Gmail?')) return;
            await fetch('/api/admin/gmail', { method: 'DELETE' });
            location.reload();
          }}
          className="text-xs text-[#29384a]/50 transition hover:text-red-600"
        >
          Desconectar cuenta
        </button>
      </div>
    </aside>
  );

  // ── Thread panel ──────────────────────────────────────────────
  const ThreadPanel = (
    <div className={`flex flex-col bg-[#faf8f2]
      ${selected ? 'flex' : 'hidden lg:flex'}
      flex-1 min-w-0 min-h-0`}
    >
      {!selected || !selectedEmail ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[#29384a]/60">
          <Mail className="h-10 w-10 text-[#d8cbb5]" />
          <p>Selecciona un correo</p>
        </div>
      ) : (
        <>
          {/* Thread header */}
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
              <p className="truncate text-sm font-semibold text-[#07111d]">{selectedEmail.subject}</p>
              <p className="truncate text-xs text-[#29384a]/60">{selectedEmail.from}</p>
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
            {loadingThread ? (
              <p className="pt-8 text-center text-sm text-[#29384a]/60">Cargando hilo...</p>
            ) : threadMessages.map((msg) => {
              const isOwn = msg.fromEmail === gmailEmail;
              return (
                <div key={msg.id} className={`rounded-xl border p-4 ${
                  isOwn
                    ? 'border-[#D4A017]/20 bg-[#D4A017]/5'
                    : 'border-[#d8cbb5] bg-white'
                }`}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#07111d]">{msg.from}</p>
                      <p className="text-[10px] text-[#29384a]/60">Para: {msg.to}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#29384a]/50">{fmtDate(msg.date)}</span>
                  </div>
                  <div
                    className="max-w-none text-xs leading-relaxed text-[#07111d] overflow-auto"
                    dangerouslySetInnerHTML={{
                      __html: msg.body.includes('<')
                        ? msg.body
                        : msg.body.replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Reply box */}
          <div className="border-t border-[#d8cbb5] bg-white p-4 space-y-3">
            {sendError && <p className="text-xs text-red-600">{sendError}</p>}
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={`Responder a ${lastMsg?.fromEmail ?? ''}...`}
              rows={3}
              className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-3 text-sm outline-none focus:border-[#c88b25]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendReply}
                disabled={sending || !reply.trim()}
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
      <div className="flex h-[calc(100dvh-3rem)] overflow-hidden lg:h-screen">
        {EmailList}
        {ThreadPanel}
      </div>

      {/* Associate to case modal */}
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
