'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa-install-dismissed';

export function InstallPwaPrompt({ variant = 'banner' }: { variant?: 'banner' | 'inline' }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed (running as standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    // Previously dismissed in this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setDismissed(false);

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
    dismiss();
  };

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  if (installed || dismissed || !promptEvent) return null;

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#d7a33a]/30 bg-[#d7a33a]/5 px-5 py-4">
        <Download className="h-5 w-5 shrink-0 text-[#d7a33a]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#07111d]">Instala la app para acceso rápido</p>
          <p className="text-xs text-[#29384a]">Accede al panel sin abrir el navegador, recibe notificaciones.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={install}
            className="rounded-xl bg-[#d7a33a] px-3 py-1.5 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]"
          >
            Instalar
          </button>
          <button type="button" onClick={dismiss} className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e8d8]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Banner variant — fixed bottom, above nav
  return (
    <div className="fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 z-[60] border-t border-[#d7a33a]/20 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/EXPERT_logo/expert-isotipo.png"
          alt="EXPERT"
          className="h-10 w-10 shrink-0 rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#07111d]">Instala EXPERT</p>
          <p className="text-xs text-[#29384a]">Acceso directo desde tu pantalla de inicio</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={install}
            className="flex items-center gap-1.5 rounded-full bg-[#07111d] px-4 py-2 text-xs font-bold text-[#d7a33a] transition hover:bg-[#0d1f35]"
          >
            <Download className="h-3.5 w-3.5" />
            Instalar
          </button>
          <button type="button" onClick={dismiss} aria-label="Cerrar" className="rounded-full p-2 text-[#29384a] hover:bg-[#f0e8d8]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
