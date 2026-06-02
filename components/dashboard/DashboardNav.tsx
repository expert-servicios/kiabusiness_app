'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  BarChart2, Calendar, ChevronLeft, ChevronRight, CreditCard, FileBarChart,
  FolderOpen, Globe, LayoutDashboard, LogOut, ShieldCheck, ShoppingBag, User,
} from 'lucide-react';
import { CompanySwitcher } from './CompanySwitcher';
import { NotificationBell } from './NotificationBell';

const NAV_LINKS = [
  { href: '/dashboard',                  label: 'Panel',             icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/servicios',        label: 'Servicios',         icon: ShoppingBag,     exact: false },
  { href: '/dashboard/expedientes',      label: 'Expedientes',       icon: FolderOpen,      exact: false },
  { href: '/dashboard/estado-empresa',   label: 'Estado empresa',    icon: BarChart2,       exact: false },
  { href: '/dashboard/informes',         label: 'Informes',          icon: FileBarChart,    exact: false },
  { href: '/dashboard/presupuestos',     label: 'Presupuestos',      icon: CreditCard,      exact: false },
  { href: '/dashboard/calendario-fiscal',label: 'Calendario Fiscal', icon: Calendar,        exact: false },
  { href: '/dashboard/suscripciones',    label: 'Suscripciones',     icon: CreditCard,      exact: false },
  { href: '/dashboard/perfil',           label: 'Mi perfil',         icon: User,            exact: false },
];

interface Company { id: string; razon_social: string; forma_juridica: string; role: string }

interface Props {
  companies: Company[];
  activeCompanyId: string | null;
  userName: string | null;
  userEmail: string;
  isAdmin: boolean;
}

export function DashboardNav({ companies, activeCompanyId, userName, userEmail, isAdmin }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const displayName = userName ?? userEmail.split('@')[0];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <>
      {/* ── MOBILE: compact fixed top bar ─────────────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/8 bg-[#07111d] px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="font-serif text-sm font-bold tracking-[0.22em] text-white">
          EXPERT
        </Link>
        <div className="flex items-center gap-2">
          <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />
          <NotificationBell />
          {isAdmin && (
            <Link
              href="/admin"
              title="Panel de administración"
              className="flex items-center gap-1 rounded-full border border-[#D4A017]/40 bg-[#D4A017]/10 px-2 py-1 text-[10px] font-bold text-[#D4A017]"
            >
              <ShieldCheck className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* ── DESKTOP: collapsible sidebar ──────────────────────────────────── */}
      <aside
        className={`hidden lg:flex lg:shrink-0 lg:flex-col lg:border-r lg:border-white/8 lg:bg-[#07111d] lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden lg:transition-all lg:duration-200 ${
          collapsed ? 'lg:w-[60px]' : 'lg:w-56'
        }`}
      >
        <div className="flex h-full flex-col">

          {/* Header */}
          <div className="flex items-center border-b border-white/8 px-3 py-4">
            {!collapsed && (
              <Link
                href="/dashboard"
                className="flex-1 font-serif text-sm font-bold tracking-[0.22em] text-white"
              >
                EXPERT
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/6 hover:text-white"
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {collapsed
                ? <ChevronRight className="h-4 w-4" />
                : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Company switcher + notifications (expanded only) */}
          {!collapsed && (
            <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
              <div className="min-w-0 flex-1">
                <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />
              </div>
              <NotificationBell />
            </div>
          )}

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition ${
                    collapsed ? 'justify-center' : 'gap-3'
                  } ${
                    active
                      ? 'bg-[#D4A017]/15 font-semibold text-[#D4A017]'
                      : 'text-white/60 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                title={collapsed ? 'Panel Admin' : undefined}
                className={`mt-2 flex items-center rounded-lg border border-[#D4A017]/40 bg-[#D4A017]/10 px-3 py-2 text-sm font-bold text-[#D4A017] transition hover:border-[#D4A017]/70 hover:bg-[#D4A017]/20 ${
                  collapsed ? 'justify-center' : 'gap-3'
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {!collapsed && 'Panel Admin'}
              </Link>
            )}
          </nav>

          {/* Footer: user info + links + logout */}
          <div className="border-t border-white/8 px-2 py-3 space-y-1">
            {!collapsed && (
              <div className="mb-2 rounded-lg bg-white/4 px-3 py-2">
                <p className="truncate text-xs font-semibold text-white/80">{displayName}</p>
                <p className="truncate text-[10px] text-white/40">{userEmail}</p>
              </div>
            )}

            <Link
              href="/"
              title={collapsed ? 'Web pública' : undefined}
              className={`flex items-center rounded-lg px-3 py-2 text-xs text-white/50 transition hover:bg-white/6 hover:text-white ${
                collapsed ? 'justify-center' : 'gap-2'
              }`}
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && 'Web pública'}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? 'Cerrar sesión' : undefined}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-xs text-white/40 transition hover:bg-white/8 hover:text-red-400 ${
                collapsed ? 'justify-center' : 'gap-2'
              }`}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && 'Cerrar sesión'}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
