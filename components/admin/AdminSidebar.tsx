'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CreditCard, FolderOpen, LayoutDashboard,
  Menu, Plug, UserPlus, Users, X, Zap, ShieldCheck,
  Settings, User, Search,
} from 'lucide-react';
import { AdminUserDrawer } from './AdminUserDrawer';

interface NavItem { label: string; href: string; badge?: number }
interface NavGroup { label: string; short: string; icon: React.ElementType; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Clientes',
    short: 'Clientes',
    icon: Users,
    items: [
      { label: 'Clientes', href: '/admin/clientes' },
      { label: 'Usuarios', href: '/admin/usuarios' },
      { label: 'Onboarding', href: '/admin/onboarding' },
      { label: 'Calendario', href: '/admin/calendario-fiscal' },
    ],
  },
  {
    label: 'Operaciones',
    short: 'Ops',
    icon: FolderOpen,
    items: [
      { label: 'Expedientes', href: '/admin/expedientes' },
      { label: 'Documentos', href: '/admin/documentos' },
      { label: 'Citas', href: '/admin/citas' },
      { label: 'Presupuestos', href: '/admin/presupuestos' },
    ],
  },
  {
    label: 'Facturación',
    short: 'Factura',
    icon: CreditCard,
    items: [
      { label: 'Suscripciones', href: '/admin/suscripciones' },
      { label: 'Pagos Stripe', href: '/admin/pagos' },
      { label: 'Emails', href: '/admin/emails' },
    ],
  },
  {
    label: 'Marketing',
    short: 'Mktg',
    icon: Zap,
    items: [
      { label: 'Leads SaaS', href: '/admin/saas-leads' },
      { label: 'Holded Demos', href: '/admin/holded-demos' },
    ],
  },
  {
    label: 'Equipo',
    short: 'Equipo',
    icon: UserPlus,
    items: [
      { label: 'Equipo y accesos', href: '/admin/equipo' },
    ],
  },
  {
    label: 'Sistema',
    short: 'Sistema',
    icon: Plug,
    items: [
      { label: 'Panel Gerente', href: '/admin/executive' },
      { label: 'Rentabilidad', href: '/admin/rentabilidad' },
      { label: 'Kia Health', href: '/admin/kia-health' },
      { label: 'Kia Auditor', href: '/admin/kia-auditor' },
      { label: 'Reportes', href: '/admin/reportes' },
    ],
  },
];

interface Props {
  userName: string | null;
  userEmail: string;
  urgentCount?: number;
}

export function AdminSidebar({ userName, userEmail, urgentCount = 0 }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(NAV_GROUPS[0].label);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-select tab based on current route
  useEffect(() => {
    const match = NAV_GROUPS.find((g) => g.items.some((i) => pathname.startsWith(i.href)));
    if (match) setActiveTab(match.label);
  }, [pathname]);

  // Persist tab selection
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarTab');
    if (saved && NAV_GROUPS.some((g) => g.label === saved)) {
      // Only apply saved tab if current route doesn't override it
      const routeMatch = NAV_GROUPS.find((g) => g.items.some((i) => pathname.startsWith(i.href)));
      if (!routeMatch) setActiveTab(saved);
    }
  }, [pathname]);

  const saveTab = (label: string) => {
    setActiveTab(label);
    localStorage.setItem('adminSidebarTab', label);
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const displayName = userName ?? userEmail.split('@')[0];
  const activeGroup = NAV_GROUPS.find((g) => g.label === activeTab) ?? NAV_GROUPS[0];

  function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    return (
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
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-lg p-1 text-white/40 hover:bg-white/8 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Global search trigger */}
        <div className="px-3 pt-3">
          <button
            type="button"
            title="Búsqueda global (⌘K)"
            aria-label="Abrir búsqueda global"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
            className="flex w-full items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs text-white/40 transition hover:bg-white/8 hover:text-white/70"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Buscar…</span>
            <kbd className="rounded border border-white/10 px-1 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        </div>

        {/* Dashboard link */}
        <div className="px-3 pt-2">
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

        {/* Category tabs */}
        <div className="mx-3 mt-3 flex rounded-xl bg-white/4 p-1">
          {NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            const isSelected = activeTab === group.label;
            const hasActive = group.items.some((i) => isActive(i.href));
            return (
              <button
                key={group.label}
                type="button"
                title={group.label}
                onClick={() => saveTab(group.label)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition ${
                  isSelected
                    ? 'bg-[#D4A017]/20 text-[#D4A017]'
                    : hasActive
                    ? 'text-[#D4A017]/70 hover:text-[#D4A017]'
                    : 'text-white/35 hover:text-white/70'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        {/* Active category label */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            {activeGroup.label}
          </span>
        </div>

        {/* Nav items for active tab */}
        <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
          {activeGroup.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                isActive(item.href)
                  ? 'bg-[#D4A017]/12 font-semibold text-[#D4A017]'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
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
        </nav>

        {/* Footer — user avatar + actions */}
        <div className="border-t border-white/8 px-3 py-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl bg-white/4 px-3 py-2.5 text-left transition hover:bg-white/8"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/20 text-[#D4A017]">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white/80">{displayName}</p>
              <p className="truncate text-[10px] text-white/40">{userEmail}</p>
            </div>
            <Settings className="h-3.5 w-3.5 shrink-0 text-white/30" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── MOBILE topbar ── */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/8 bg-[#07111d] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#D4A017]" />
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Admin</span>
          {urgentCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {urgentCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/8 hover:text-white"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/8 hover:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE drawer ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#07111d] transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isMobile />
      </aside>

      {/* ── DESKTOP sidebar ── */}
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/8 lg:bg-[#07111d] lg:sticky lg:top-0 lg:h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/* ── User settings drawer ── */}
      <AdminUserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}
