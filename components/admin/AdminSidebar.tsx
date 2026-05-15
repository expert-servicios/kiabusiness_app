'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  BarChart3, Calendar, ChevronDown, ChevronRight, CreditCard, FileText,
  FolderOpen, LayoutDashboard, LogOut, Mail, Menu, Plug,
  Sparkles, UserPlus, Users, X, Zap, ShieldCheck
} from 'lucide-react';

interface NavItem { label: string; href: string; badge?: number }
interface NavGroup { label: string; icon: React.ElementType; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Clientes',
    icon: Users,
    items: [
      { label: 'Onboarding', href: '/admin/onboarding' },
      { label: 'Usuarios', href: '/admin/usuarios' },
      { label: 'Calendario Fiscal', href: '/admin/calendario-fiscal' },
    ]
  },
  {
    label: 'Operaciones',
    icon: FolderOpen,
    items: [
      { label: 'Expedientes', href: '/admin/expedientes' },
      { label: 'Presupuestos', href: '/admin/presupuestos' },
    ]
  },
  {
    label: 'Facturación',
    icon: CreditCard,
    items: [
      { label: 'Suscripciones', href: '/admin/suscripciones' },
      { label: 'Emails', href: '/admin/emails' },
    ]
  },
  {
    label: 'Marketing',
    icon: Zap,
    items: [
      { label: 'Leads SaaS', href: '/admin/saas-leads' },
      { label: 'Holded Demos', href: '/admin/holded-demos' },
    ]
  },
  {
    label: 'Sistema',
    icon: Plug,
    items: [
      { label: 'Integraciones', href: '/admin/integraciones' },
      { label: 'Reportes', href: '/admin/reportes' },
    ]
  },
];

interface Props {
  userName: string | null;
  userEmail: string;
  urgentCount?: number;
}

export function AdminSidebar({ userName, userEmail, urgentCount = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const displayName = userName ?? userEmail.split('@')[0];

  const toggleGroup = (label: string) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const handleLogout = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createBrowserClient(url, key);
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#D4A017]">
          <ShieldCheck className="h-4 w-4 text-[#07111d]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4A017]">Expert</p>
          <p className="text-[10px] text-white/40">Panel de administración</p>
        </div>
      </div>

      {/* Dashboard link */}
      <div className="px-3 pt-3">
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isActive('/admin')
              ? 'bg-[#D4A017]/15 text-[#D4A017]'
              : 'text-white/70 hover:bg-white/6 hover:text-white'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard
          {urgentCount > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {urgentCount}
            </span>
          )}
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {NAV_GROUPS.map((group) => {
          const isOpen = collapsed[group.label] !== true;
          const Icon = group.icon;
          const groupActive = group.items.some((item) => isActive(item.href));

          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${
                  groupActive ? 'text-white/90' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                {isOpen
                  ? <ChevronDown className="h-3 w-3" />
                  : <ChevronRight className="h-3 w-3" />}
              </button>

              {isOpen && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition ${
                        isActive(item.href)
                          ? 'bg-[#D4A017]/12 font-semibold text-[#D4A017]'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                      {item.badge ? (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4A017]/20 px-1.5 text-[10px] font-bold text-[#D4A017]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-3 py-3 space-y-1">
        {/* User info */}
        <div className="mb-2 rounded-lg bg-white/4 px-3 py-2">
          <p className="truncate text-xs font-semibold text-white/80">{displayName}</p>
          <p className="truncate text-[10px] text-white/40">{userEmail}</p>
        </div>

        {/* Switch to client view */}
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/8 hover:text-white"
        >
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
          Vista de cliente
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/40 transition hover:bg-white/8 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBILE topbar ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/8 bg-[#07111d] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#D4A017]" />
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Admin</span>
          {urgentCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {urgentCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/8 hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── MOBILE overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#07111d] transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── DESKTOP sidebar ── */}
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/8 lg:bg-[#07111d] lg:sticky lg:top-0 lg:h-screen">
        <SidebarContent />
      </aside>
    </>
  );
}
