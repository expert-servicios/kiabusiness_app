'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, FolderOpen, Menu, X, Building2, LogOut } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/integrations/supabase';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/tenant/dashboard',   icon: LayoutDashboard },
  { label: 'Clientes',    href: '/tenant/clientes',    icon: Users },
  { label: 'Expedientes', href: '/tenant/expedientes', icon: FolderOpen },
];

interface Props {
  tenantName: string;
  brandColor: string;
  userName: string;
  userEmail: string;
}

function NavContent({
  tenantName,
  brandColor,
  userName,
  userEmail,
  onClose,
}: Props & { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-full flex-col bg-[#07111d]">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-4">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
          style={{ backgroundColor: brandColor }}
        >
          {tenantName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: brandColor }}>
            {tenantName}
          </p>
          <p className="text-[10px] text-white/40">Portal asesoría</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-white/40 hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/6 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-3 py-3">
        <div className="rounded-xl bg-white/4 px-3 py-2.5">
          <p className="truncate text-xs font-semibold text-white/80">{userName}</p>
          <p className="truncate text-[10px] text-white/40">{userEmail}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 transition hover:bg-white/6 hover:text-white/70"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function TenantSidebar({ tenantName, brandColor, userName, userEmail }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/8 bg-[#07111d] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" style={{ color: brandColor }} />
          <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: brandColor }}>
            {tenantName}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/8 hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent
          tenantName={tenantName}
          brandColor={brandColor}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/8 lg:sticky lg:top-0 lg:h-screen overflow-hidden">
        <NavContent
          tenantName={tenantName}
          brandColor={brandColor}
          userName={userName}
          userEmail={userEmail}
        />
      </aside>
    </>
  );
}
