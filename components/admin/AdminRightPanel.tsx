'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Mail, Bell, PanelRightOpen, PanelRightClose, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { WhatsAppInbox } from './WhatsAppInbox';
import { CorreoInbox } from './CorreoInbox';

type PanelTab = 'whatsapp' | 'correo' | 'notificaciones';

// ── WhatsApp tab ───────────────────────────────────────────────────────────────
function WhatsAppTab() {
  const [conversations, setConversations] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/whatsapp')
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PanelLoader />;
  return (
    <WhatsAppInbox
      initialConversations={conversations as Parameters<typeof WhatsAppInbox>[0]['initialConversations']}
    />
  );
}

// ── Correo tab ─────────────────────────────────────────────────────────────────
type CorreoData = {
  ms365Connected: boolean;
  ms365Email: string | null;
  gmailConnected: boolean;
  gmailEmail: string | null;
  gmailSA: boolean;
  initialMails: Parameters<typeof CorreoInbox>[0]['initialMails'];
  initialProvider: 'ms365' | 'gmail';
};

const CORREO_FALLBACK: CorreoData = {
  ms365Connected: false, ms365Email: null,
  gmailConnected: false, gmailEmail: null,
  gmailSA: false, initialMails: [], initialProvider: 'ms365',
};

function CorreoTab() {
  const [data, setData] = useState<CorreoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const statusRes = await fetch('/api/admin/correo?action=status');
        if (!statusRes.ok) { setData(CORREO_FALLBACK); return; }
        const status = await statusRes.json();

        const ms365Connected: boolean = status.ms365Connected ?? false;
        const gmailConnected: boolean = status.gmailConnected ?? false;
        const initialProvider: 'ms365' | 'gmail' = gmailConnected ? 'gmail' : 'ms365';

        let initialMails: Parameters<typeof CorreoInbox>[0]['initialMails'] = [];
        if (ms365Connected || gmailConnected) {
          const mailsRes = await fetch(
            `/api/admin/correo?action=list&provider=${initialProvider}`
          );
          if (mailsRes.ok) {
            const d = await mailsRes.json();
            initialMails = d.mails ?? [];
          }
        }
        setData({
          ms365Connected,
          ms365Email: status.ms365Email ?? null,
          gmailConnected,
          gmailEmail: status.gmailEmail ?? null,
          gmailSA: status.gmailSA ?? false,
          initialMails,
          initialProvider,
        });
      } catch {
        setData(CORREO_FALLBACK);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PanelLoader />;
  if (!data) return null;
  return (
    <CorreoInbox
      ms365Connected={data.ms365Connected}
      ms365Email={data.ms365Email}
      gmailConnected={data.gmailConnected}
      gmailEmail={data.gmailEmail}
      gmailSA={data.gmailSA}
      initialMails={data.initialMails as Parameters<typeof CorreoInbox>[0]['initialMails']}
      initialProvider={data.initialProvider}
      errorParam={null}
      connectedParam={null}
    />
  );
}

// ── Notificaciones tab ─────────────────────────────────────────────────────────
function NotificacionesTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Bell className="h-10 w-10 text-white/20" />
      <p className="text-sm font-semibold text-white/50">Bandeja de notificaciones</p>
      <p className="text-xs text-white/30">Las alertas del sistema aparecerán aquí.</p>
    </div>
  );
}

// ── Loading placeholder ───────────────────────────────────────────────────────
function PanelLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/30" />
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { id: PanelTab; label: string; icon: React.ElementType }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'correo', label: 'Correo', icon: Mail },
  { id: 'notificaciones', label: 'Avisos', icon: Bell },
];

// ── Main panel ─────────────────────────────────────────────────────────────────
export function AdminRightPanel({ emailUnreadCount = 0 }: { emailUnreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [tab, setTab] = useState<PanelTab>('whatsapp');
  const [mounted, setMounted] = useState<Set<PanelTab>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('adminRightPanel');
    if (saved === 'open') setOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
    if (localStorage.getItem('adminRightPanelWide') === 'true') setWide(true);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem('adminRightPanel', next ? 'open' : 'closed');
      return next;
    });
  }, []);

  const toggleWide = useCallback(() => {
    setWide((prev) => {
      const next = !prev;
      localStorage.setItem('adminRightPanelWide', String(next));
      return next;
    });
  }, []);

  const handleTabChange = (t: PanelTab) => {
    setTab(t);
    setMounted((prev) => new Set([...prev, t]));
  };

  // Mount active tab when panel opens
  useEffect(() => {
    if (open) setMounted((prev) => new Set([...prev, tab])); // eslint-disable-line react-hooks/set-state-in-effect
  }, [open, tab]);

  return (
    <>
      {/* Toggle button — hidden on mobile, sticky on desktop */}
      <button
        type="button"
        onClick={toggle}
        title={open ? 'Cerrar inbox' : 'Abrir inbox'}
        className="hidden lg:flex fixed right-0 z-30 flex-col items-center gap-1 rounded-l-xl border border-r-0 border-white/10 bg-[#07111d] px-2 py-3 text-white/40 shadow-lg transition hover:text-white/80 top-1/2 -translate-y-1/2"
      >
        {open
          ? <PanelRightClose className="h-4 w-4" />
          : <PanelRightOpen className="h-4 w-4" />}
        {!open && emailUnreadCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
            {emailUnreadCount > 99 ? '99+' : emailUnreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-l border-white/8 bg-[#07111d] sticky top-0 h-screen overflow-hidden transition-[width] duration-300 ease-in-out ${
          open ? (wide ? 'w-[50vw]' : 'w-[420px]') : 'w-0'
        }`}
      >
        {open && (
          <>
            {/* Panel header */}
            <div className="flex items-center border-b border-white/8 px-1 py-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id)}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    tab === id
                      ? 'bg-[#D4A017]/15 text-[#D4A017]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {id === 'correo' && emailUnreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-500 px-0.5 text-[8px] font-bold text-white">
                      {emailUnreadCount > 99 ? '99+' : emailUnreadCount}
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={toggleWide}
                title={wide ? 'Reducir panel' : 'Ampliar panel'}
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/70"
              >
                {wide ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Tab content — keep all mounted to preserve state */}
            <div className="relative flex-1 overflow-hidden">
              {TABS.map(({ id }) => (
                <div
                  key={id}
                  className={`absolute inset-0 overflow-auto ${tab === id ? 'z-10 visible' : 'z-0 invisible'}`}
                >
                  {mounted.has(id) && (
                    id === 'whatsapp' ? <WhatsAppTab /> :
                    id === 'correo'   ? <CorreoTab />   :
                    <NotificacionesTab />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
