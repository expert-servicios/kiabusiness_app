'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, CreditCard, Users, Calendar } from 'lucide-react';

const TABS = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/admin/expedientes', label: 'Tramites', icon: FolderOpen, exact: false },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, exact: false },
  { href: '/admin/calendario-fiscal', label: 'Agenda', icon: Calendar, exact: false },
  { href: '/admin/pagos', label: 'Factura', icon: CreditCard, exact: false },
];

export function AdminMobileNav({ urgentCount = 0 }: { urgentCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07111d] lg:hidden">
      <div className="flex items-stretch">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const isHome = exact && href === '/admin';
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition active:opacity-70 ${
                active ? 'text-[#d7a33a]' : 'text-white/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
              {isHome && urgentCount > 0 && (
                <span className="absolute right-1 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                  {urgentCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="wa-safe-bottom bg-[#07111d]" />
    </nav>
  );
}
