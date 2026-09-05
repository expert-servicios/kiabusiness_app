'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Mail, RefreshCw, ArrowLeft, Send, Link2, Search, X, Check, PenSquare, Sparkles, FolderInput } from 'lucide-react';

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
  client_id: string;
  company_id: string | null;
  client: { full_name: string | null; email: string };
}

interface FolderRow {
  id: string;
  name: string;
  system_key: 'inbox' | 'sent' | null;
  is_system: boolean;
}

interface FolderState {
  folder_id: string | null;
  source_kind: 'inbox_thread' | 'sent_event';
  provider: string;
  source_key: string;
  client_id: string | null;
  company_id: string | null;
  case_id: string | null;
  is_archived: boolean;
}

type Provider = 'ms365' | 'gmail';

const MONTH = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtDate(str: string) {
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
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
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [folderStates, setFolderStates] = useState<FolderState[]>([]);
  const [movingFolder, setMovingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

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
  const anyConnected = ms365Connected || gmailConnected;
  const selectedSummary = mails.find((m) => m.conversationId === selected);
  const lastMsg = threadMessages.at(-1);
  const customFolders = folders.filter((folder) => !folder.is_system);

  const currentFolderState = useMemo(() => folderStates.find((state) =>
    state.source_kind === 'inbox_thread' && state.provider === provider && state.source_key === selected
  ) ?? null, [folderStates, provider, selected]);

  const loadFolderData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/correo/folders', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      setFolders(data.folders ?? []);
      setFolderStates(data.states ?? []);
    } catch { /* non-blocking */ }
  }, []);

  const ensureCases = useCallback(async () => {
    if (cases.length > 0) return cases;
    const res = await fetch('/api/admin/cases', { cache: 'no-store' });
    if (!res.ok) return [] as Case[];
    const data = await res.json();
    const loaded = (data.cases ?? []) as Case[];
    setCases(loaded);
    return loaded;
  }, [cases]);

  const loadMails = useCallback(async (prov: Provider, q?: string) => {
    const params = new URLSearchParams({ action: 'list', provider: prov });
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/correo?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMails(data.mails ?? []);
      void loadFolderData();
    }
  }, [loadFolderData]);

  useEffect(() => { void loadFolderData(); }, [loadFolderData]);

  useEffect(() => {
    if (!activeConnected) { setMails([]); return; } // eslint-disable-line react-hooks/set-state-in-effect
    setSelected(null);
    setThreadMessages([]);
    void loadMails(provider);
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
    } catch { /* non-blocking */ }
    setLoadingThread(false);
  }, []);

  const handleSelect = useCallback((conversationId: string) => {
    setSelected(conversationId);
    setSendError(null);
    setFolderError(null);
    setReply('');
    setMails((prev) => prev.map((m) => m.conversationId === conversationId ? { ...m, unread: false } : m));
    void loadThread(conversationId, provider);
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

  const handleMove = async (folderId: string | null, explicitCaseId?: string | null) => {
    if (!selected || !selectedSummary) return;
    setMovingFolder(true);
    setFolderError(null);
    try {
      const availableCases = await ensureCases();
      const caseId = explicitCaseId === undefined ? linkedCaseId : explicitCaseId;
      const linkedCase = caseId ? availableCases.find((item) => item.id === caseId) ?? null : null;
      const res = await fetch('/api/admin/correo/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          sourceKind: 'inbox_thread',
          provider,
          sourceKey: selected,
          folderId,
          clientId: linkedCase?.client_id ?? currentFolderState?.client_id ?? null,
          companyId: linkedCase?.company_id ?? currentFolderState?.company_id ?? null,
          caseId: caseId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo mover el correo');

      setFolderStates((prev) => {
        const rest = prev.filter((state) => !(state.source_kind === 'inbox_thread' && state.provider === provider && state.source_key === selected));
        if (!folderId) return rest;
        return [...rest, {
          folder_id: folderId,
          source_kind: 'inbox_thread',
          provider,
          source_key: selected,
          client_id: linkedCase?.client_id ?? currentFolderState?.client_id ?? null,
          company_id: linkedCase?.company_id ?? currentFolderState?.company_id ?? null,
          case_id: caseId ?? null,
          is_archived: false,
        }];
      });
      window.dispatchEvent(new Event('correo-folders-changed'));
      if (folderId) {
        setMails((prev) => prev.filter((mail) => mail.conversationId !== selected));
        setSelected(null);
        setThreadMessages([]);
      }
      await loadFolderData();
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : 'No se pudo mover el correo');
    } finally {
      setMovingFolder(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedMailId || !selected) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/admin/correo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply', provider, messageId: selectedMailId, comment: reply.trim(),
          conversationId: selected, subject: lastMsg?.subject, clientEmail: lastMsg?.fromEmail,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error ?? 'Error al enviar');
        return;
      }
      setThreadMessages((prev) => [...prev, {
        id: crypto.randomUUID(), conversationId: selected, subject: lastMsg?.subject ?? '',
        from: activeEmail ?? 'admin', fromEmail: activeEmail ?? '', to: lastMsg?.fromEmail ?? '',
        date: new Date().toISOString(), body: reply.trim(), bodyType: 'text', unread: false,
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compose: true, composeTo: composeTo.trim() || undefined, composeTopic: composeTopic.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subject && !composeSubject) setComposeSubject(data.subject);
        if (data.suggestion) setComposeBody(data.suggestion);
      }
    } catch { /* non-blocking */ }
    setComposeKiaLoading(false);
  };

  const handleSendCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;
    setComposeSending(true);
    setComposeError(null);
    try {
      const res = await fetch('/api/admin/correo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compose', provider, to: composeTo.trim(), subject: composeSubject.trim(), body: composeBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setComposeError(data.error ?? 'Error al enviar');
        return;
      }
      setShowCompose(false);
      setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeTopic('');
    } catch {
      setComposeError('Error de conexión.');
    } finally {
      setComposeSending(false);
    }
  };

  const openLinkModal = async () => {
    setShowLinkModal(true);
    await ensureCases();
  };

  const handleSuggestAI = async () => {
    if (!selectedSummary || threadMessages.length === 0) return;
    setSuggestingAI(true);
    try {
      const res = await fetch('/api/admin/correo/suggest-reply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSummary.subject, messages: threadMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) setReply(data.suggestion);
      }
    } catch { /* non-blocking */ }
    setSuggestingAI(false);
  };

  const handleLink = async (caseId: string | null) => {
    if (!selected || !selectedSummary) return;
    setLinking(true);
    try {
      const res = await fetch('/api/admin/correo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', conversationId: selected, caseId, subject: selectedSummary.subject, clientEmail: selectedSummary.fromEmail }),
      });
      if (!res.ok) return;
      setLinkedCaseId(caseId);
      if (currentFolderState?.folder_id) await handleMove(currentFolderState.folder_id, caseId);
      setShowLinkModal(false);
    } finally {
      setLinking(false);
    }
  };

  const filteredCases = cases.filter((c) =>
    !caseSearch || c.service?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.client?.full_name?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.client?.email?.toLowerCase().includes(caseSearch.toLowerCase())
  );

  if (!anyConnected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-blue-50 p-5"><Mail className="h-10 w-10 text-blue-500" /></div>
        <div>
          <h2 className="text-lg font-bold text-[#07111d]">Conecta tu cuenta de correo</h2>
          <p className="mt-1 max-w-xs text-sm text-[#29384a]">Gestiona correos de clientes y asócialos a sus expedientes, todo sin salir del panel.</p>
          {errorParam && <p className="mt-2 text-xs text-red-600">{errorParam === 'oauth_denied' ? 'Acceso denegado.' : 'Error al conectar. Inténtalo de nuevo.'}</p>}
          {connectedParam && <p className="mt-2 text-xs text-green-700">Cuenta conectada correctamente.</p>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="/api/auth/google-gmail" className="rounded-full border border-[#d8cbb5] bg-white px-5 py-2.5 text-sm font-bold text-[#07111d]">Conectar Gmail</a>
          <a href="/api/auth/ms365" className="rounded-full bg-[#07111d] px-5 py-2.5 text-sm font-bold text-white">Conectar Microsoft 365</a>
        </div>
        <p className="text-xs text-[#29384a]/50">Solo permisos de lectura y envío de correo.</p>
      </div>
    );
  }

  const ProviderBar = (
    <div className="flex items-center gap-1 border-b border-[#d8cbb5] bg-white px-4 py-2">
      {gmailConnected && <button type="button" onClick={() => setProvider('gmail')} className={`rounded-full px-3 py-1 text-xs font-semibold ${provider === 'gmail' ? 'bg-[#07111d] text-white' : 'text-[#29384a] hover:bg-[#f0e9d8]'}`}>Gmail</button>}
      {ms365Connected && <button type="button" onClick={() => setProvider('ms365')} className={`rounded-full px-3 py-1 text-xs font-semibold ${provider === 'ms365' ? 'bg-[#07111d] text-white' : 'text-[#29384a] hover:bg-[#f0e9d8]'}`}>Outlook</button>}
      <div className="ml-auto flex gap-2">
        {!gmailConnected && <a href="/api/auth/google-gmail" className="text-[10px] font-semibold text-[#c88b25]">+ Gmail</a>}
        {!ms365Connected && <a href="/api/auth/ms365" className="text-[10px] font-semibold text-[#c88b25]">+ Outlook</a>}
      </div>
    </div>
  );

  if (!activeConnected) {
    return (
      <div className="flex h-full flex-col">
        {ProviderBar}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <Mail className="h-10 w-10 text-[#d8cbb5]" />
          <p className="text-sm text-[#29384a]">{provider === 'gmail' ? 'Gmail no conectado.' : 'Microsoft 365 no conectado.'}</p>
          <a href={provider === 'gmail' ? '/api/auth/google-gmail' : '/api/auth/ms365'} className="rounded-full bg-[#07111d] px-5 py-2.5 text-sm font-bold text-white">Conectar {provider === 'gmail' ? 'Gmail' : 'Microsoft 365'}</a>
        </div>
      </div>
    );
  }

  const MailList = (
    <aside className={`flex flex-col border-r border-[#d8cbb5] bg-white ${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 lg:shrink-0`}>
      <div className="space-y-2 border-b border-[#d8cbb5] px-4 py-3">
        <div className="flex items-center justify-between">
          <div><h1 className="font-serif text-base font-bold text-[#07111d]">Correo</h1><p className="max-w-[140px] truncate text-[10px] text-[#29384a]/60">{activeEmail}</p></div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => { setShowCompose(true); setComposeError(null); }} className="flex items-center gap-1 rounded-lg bg-[#07111d] px-2.5 py-1.5 text-xs font-semibold text-white"><PenSquare className="h-3.5 w-3.5" />Nuevo</button>
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] hover:bg-[#f0e9d8]"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2"><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar correos..." className="flex-1 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs outline-none" /><button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#07111d] text-white"><Search className="h-3.5 w-3.5" /></button></form>
      </div>
      <ul className="flex-1 divide-y divide-[#f0e9d8] overflow-y-auto">
        {mails.length === 0 && <li className="px-4 py-12 text-center text-sm text-[#29384a]">Sin correos en la bandeja.</li>}
        {mails.map((mail) => <li key={mail.id}><button type="button" onClick={() => handleSelect(mail.conversationId)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left ${selected === mail.conversationId ? 'bg-[#faf8f2]' : 'hover:bg-[#faf8f2]'}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{initials(mail.from)}</div><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-1"><p className={`truncate text-sm ${mail.unread ? 'font-bold' : 'font-medium'} text-[#07111d]`}>{mail.from || mail.fromEmail}</p><span className="shrink-0 text-[10px] text-[#29384a]/60">{fmtDate(mail.date)}</span></div><p className="truncate text-xs text-[#29384a]">{mail.subject}</p><p className="mt-0.5 truncate text-xs text-[#29384a]/60">{mail.snippet}</p></div>{mail.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}</button></li>)}
      </ul>
      {!(provider === 'gmail' && gmailSA) && <div className="border-t border-[#d8cbb5] px-4 py-2.5"><button type="button" onClick={async () => { if (!confirm(`¿Desconectar la cuenta de ${provider === 'gmail' ? 'Gmail' : 'Microsoft 365'}?`)) return; await fetch(`/api/admin/correo?provider=${provider}`, { method: 'DELETE' }); location.reload(); }} className="text-xs text-[#29384a]/50 hover:text-red-600">Desconectar cuenta</button></div>}
    </aside>
  );

  const ThreadPanel = (
    <div className={`flex min-w-0 min-h-0 flex-1 flex-col bg-[#faf8f2] ${selected ? 'flex' : 'hidden lg:flex'}`}>
      {!selected || !selectedSummary ? <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[#29384a]/60"><Mail className="h-10 w-10 text-[#d8cbb5]" /><p>Selecciona un correo</p></div> : <>
        <div className="flex flex-wrap items-center gap-2 border-b border-[#d8cbb5] bg-white px-4 py-3">
          <button type="button" onClick={() => setSelected(null)} className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-[#29384a] lg:hidden"><ArrowLeft className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#07111d]">{selectedSummary.subject}</p><p className="truncate text-xs text-[#29384a]/60">{selectedSummary.from}</p></div>
          <label className="flex items-center gap-1.5 rounded-full border border-[#d8cbb5] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#29384a]">
            <FolderInput className="h-3 w-3" />
            <span>Mover a</span>
            <select value={currentFolderState?.folder_id ?? ''} onChange={(e) => void handleMove(e.target.value || null)} disabled={movingFolder} className="max-w-36 bg-transparent text-[10px] font-semibold outline-none">
              <option value="">Entrantes</option>
              {customFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={openLinkModal} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${linkedCaseId ? 'bg-[#D4A017]/15 text-[#c88b25]' : 'border border-[#d8cbb5] text-[#29384a]'}`}><Link2 className="h-3 w-3" />{linkedCaseId ? 'Asociado' : 'Asociar'}</button>
        </div>
        {folderError && <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{folderError}</div>}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {loadingThread ? <p className="pt-8 text-center text-sm text-[#29384a]/60">Cargando conversación...</p> : threadMessages.map((msg) => {
            const isOwn = msg.fromEmail === activeEmail;
            return <div key={msg.id} className={`rounded-xl border p-4 ${isOwn ? 'border-[#D4A017]/20 bg-[#D4A017]/5' : 'border-[#d8cbb5] bg-white'}`}><div className="mb-3 flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-[#07111d]">{msg.from || msg.fromEmail}</p><p className="text-[10px] text-[#29384a]/60">Para: {msg.to}</p></div><span className="text-[10px] text-[#29384a]/50">{fmtDate(msg.date)}</span></div>{msg.bodyType === 'html' ? <iframe title={`Correo HTML: ${msg.subject}`} srcDoc={msg.body} sandbox="allow-popups" referrerPolicy="no-referrer" className="h-96 w-full rounded-lg border border-[#f0e9d8] bg-white" /> : <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#07111d]">{msg.body}</p>}</div>;
          })}
        </div>
        <div className="space-y-3 border-t border-[#d8cbb5] bg-white p-4">
          {sendError && <p className="text-xs text-red-600">{sendError}</p>}
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Responder a ${lastMsg?.fromEmail ?? ''}...`} rows={3} className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-3 text-sm outline-none" />
          <div className="flex items-center justify-between gap-2"><button type="button" onClick={handleSuggestAI} disabled={suggestingAI || loadingThread || threadMessages.length === 0} className="flex items-center gap-1.5 rounded-full border border-[#c88b25] px-4 py-2 text-sm font-semibold text-[#c88b25]">✦ {suggestingAI ? 'Generando...' : 'Sugerir IA'}</button><button type="button" onClick={handleSendReply} disabled={sending || !reply.trim() || !selectedMailId} className="flex items-center gap-2 rounded-full bg-[#07111d] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />{sending ? 'Enviando...' : 'Responder'}</button></div>
        </div>
      </>}
    </div>
  );

  return <>
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden lg:h-screen">{ProviderBar}<div className="flex min-h-0 flex-1 overflow-hidden">{MailList}{ThreadPanel}</div></div>

    {showCompose && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowCompose(false)}><div className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4"><div className="flex items-center gap-2"><PenSquare className="h-4 w-4 text-[#c88b25]" /><p className="font-semibold text-[#07111d]">Nuevo correo</p></div><button type="button" onClick={() => setShowCompose(false)} className="rounded-lg p-1.5 text-[#29384a]"><X className="h-4 w-4" /></button></div><div className="space-y-3 p-5"><div className="flex gap-2"><input value={composeTopic} onChange={(e) => setComposeTopic(e.target.value)} placeholder="Tema o contexto para Kia (opcional)..." className="flex-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm" /><button type="button" onClick={handleKiaDraft} disabled={composeKiaLoading} className="flex items-center gap-1.5 rounded-xl border border-[#c88b25] px-3 py-2 text-sm font-semibold text-[#c88b25]"><Sparkles className="h-3.5 w-3.5" />{composeKiaLoading ? 'Redactando...' : 'Kia redacta'}</button></div><input type="email" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="Para (email del destinatario)" className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm" /><input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Asunto" className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm" /><textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Cuerpo del correo..." rows={6} className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-3 text-sm" />{composeError && <p className="text-xs text-red-600">{composeError}</p>}<div className="flex items-center justify-between gap-2 pt-1"><p className="text-[10px] text-[#29384a]/50">Enviando desde: {activeEmail}</p><div className="flex gap-2"><button type="button" onClick={() => setShowCompose(false)} className="rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm font-semibold text-[#29384a]">Cancelar</button><button type="button" onClick={handleSendCompose} disabled={composeSending || !composeTo || !composeSubject || !composeBody} className="flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />{composeSending ? 'Enviando...' : 'Enviar'}</button></div></div></div></div></div>}

    {showLinkModal && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowLinkModal(false)}><div className="w-full max-w-md rounded-t-3xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4"><p className="font-semibold text-[#07111d]">Asociar a expediente</p><button type="button" onClick={() => setShowLinkModal(false)} className="rounded-lg p-1.5 text-[#29384a]"><X className="h-4 w-4" /></button></div><div className="space-y-3 p-4"><input placeholder="Buscar expediente o cliente..." value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm" /><ul className="max-h-64 divide-y divide-[#f0e9d8] overflow-y-auto rounded-xl border border-[#f0e9d8]">{filteredCases.length === 0 && <li className="px-4 py-6 text-center text-sm text-[#29384a]/60">Sin resultados</li>}{filteredCases.map((c) => <li key={c.id}><button type="button" onClick={() => void handleLink(c.id)} disabled={linking} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-[#faf8f2]"><div><p className="font-semibold text-[#07111d]">{c.service}</p><p className="text-xs text-[#29384a]/60">{c.client?.full_name || c.client?.email}</p></div>{linkedCaseId === c.id && <Check className="h-4 w-4 text-[#1a9e4a]" />}</button></li>)}</ul>{linkedCaseId && <button type="button" onClick={() => void handleLink(null)} disabled={linking} className="w-full rounded-xl border border-red-200 py-2 text-xs text-red-600">Desasociar expediente</button>}</div></div></div>}
  </>;
}
