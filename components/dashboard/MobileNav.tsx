'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, Calendar, FileText, User } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/expedientes', label: 'Trámites', icon: FolderOpen, exact: false },
  { href: '/dashboard/calendario-fiscal', label: 'Fiscal', icon: Calendar, exact: false },
  { href: '/dashboard/presupuestos', label: 'Presupuestos', icon: FileText, exact: false },
  { href: '/dashboard/perfil', label: 'Perfil', icon: User, exact: false },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07111d] lg:hidden">
      <div className="flex items-stretch">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                active ? 'text-[#d7a33a]' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-[#d7a33a]' : ''}`} />
              {label}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iPhone home indicator */}
      <div className="h-safe-area-inset-bottom bg-[#07111d]" />
    </nav>
  );
}
