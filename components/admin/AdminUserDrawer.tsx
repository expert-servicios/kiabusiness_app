'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  X, User, Settings, Plug, Bell, LayoutDashboard, LogOut, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { PushSubscribeButton } from './PushSubscribeButton';

interface Props {
  open: boolean;
  onClose: () => void;
  userName: string | null;
  userEmail: string;
}

const SETTINGS_LINKS = [
  {
    icon: User,
    label: 'Mi perfil',
    description: 'Datos personales y contraseña',
    href: '/admin/perfil',
  },
  {
    icon: Settings,
    label: 'Configuración',
    description: 'Preferencias del panel',
    href: '/admin/configuracion',
  },
  {
    icon: Plug,
    label: 'Integraciones',
    description: 'Holded, Stripe, WhatsApp, correo',
    href: '/admin/integraciones',
  },
  {
    icon: Bell,
    label: 'Notificaciones',
    description: 'Alertas y avisos push',
    href: '/admin/notificaciones',
  },
];

export function AdminUserDrawer({ open, onClose, userName, userEmail }: Props) {
  const router = useRouter();
  const displayName = userName ?? userEmail.split('@')[0];

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-[#07111d] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            Cuenta
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        <div className="border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/20 text-sm font-bold text-[#D4A017]">
              {initials || <User className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-xs text-white/45">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Settings links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {SETTINGS_LINKS.map(({ icon: Icon, label, description, href }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/6 group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/6 text-white/50 transition group-hover:bg-[#D4A017]/15 group-hover:text-[#D4A017]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/80 group-hover:text-white">{label}</p>
                <p className="text-[11px] text-white/35">{description}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/40" />
            </Link>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-white/8 px-4 py-4 space-y-2">
          <PushSubscribeButton />

          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/6 hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Vista de cliente
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
