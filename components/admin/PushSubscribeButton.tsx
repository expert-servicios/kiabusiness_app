'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, RefreshCw } from 'lucide-react';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type State = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

export function PushSubscribeButton() {
  const [state, setState] = useState<State>('loading');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') { setState('denied'); return; }

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'unsubscribed');
      });
    });
  }, []);

  const subscribe = async () => {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as ArrayBuffer,
      });
      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setState('subscribed');
    } catch (err) {
      console.error('[push] subscribe error', err);
      if (Notification.permission === 'denied') setState('denied');
    } finally {
      setWorking(false);
    }
  };

  const unsubscribe = async () => {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('unsubscribed');
    } catch (err) {
      console.error('[push] unsubscribe error', err);
    } finally {
      setWorking(false);
    }
  };

  if (state === 'loading' || state === 'unsupported') return null;

  if (state === 'denied') {
    return (
      <div title="Notificaciones bloqueadas en el navegador" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/30">
        <BellOff className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Notificaciones bloqueadas</span>
      </div>
    );
  }

  if (state === 'subscribed') {
    return (
      <button
        type="button"
        onClick={unsubscribe}
        disabled={working}
        title="Desactivar notificaciones push"
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#D4A017] transition hover:bg-white/8"
      >
        {working ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        <span className="hidden lg:inline">Notificaciones activas</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={working}
      title="Activar notificaciones push de WhatsApp"
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white/50 transition hover:bg-white/8 hover:text-white/80"
    >
      {working ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />}
      <span className="hidden lg:inline">Activar notificaciones</span>
    </button>
  );
}
