import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { CompanySwitcher } from './CompanySwitcher';
import { LogoutButton } from './LogoutButton';
import { NotificationBell } from './NotificationBell';

interface Company {
  id: string;
  razon_social: string;
  forma_juridica: string;
  role: string;
}

interface Props {
  companies: Company[];
  activeCompanyId: string | null;
  userName: string | null;
  userEmail: string;
  isAdmin: boolean;
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/dashboard/expedientes', label: 'Expedientes' },
  { href: '/dashboard/presupuestos', label: 'Presupuestos' },
  { href: '/dashboard/calendario-fiscal', label: 'Calendario Fiscal' },
  { href: '/dashboard/suscripciones', label: 'Suscripciones' },
  { href: '/dashboard/perfil', label: 'Mi perfil' }
];

export function DashboardNav({ companies, activeCompanyId, userName, userEmail, isAdmin }: Props) {
  const displayName = userName ?? userEmail.split('@')[0];

  return (
    <nav className="sticky top-0 z-40 border-b border-white/8 bg-[#07111d]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 md:px-6">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="shrink-0 font-serif text-sm font-bold tracking-[0.22em] text-white"
        >
          EXPERT
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/6 hover:text-white"
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-1 flex items-center gap-1.5 rounded-full border border-[#d7a33a]/40 bg-[#d7a33a]/10 px-3 py-1 text-xs font-bold text-[#d7a33a] transition hover:border-[#d7a33a]/70 hover:bg-[#d7a33a]/20"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />
          <NotificationBell />
          <span className="hidden max-w-[120px] truncate text-xs text-white/40 md:block" title={userEmail}>
            {displayName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
