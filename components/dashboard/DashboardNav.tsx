import Link from 'next/link';
import { CompanySwitcher } from './CompanySwitcher';
import { LogoutButton } from './LogoutButton';

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
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#d7a33a]/80 transition hover:bg-[#d7a33a]/10 hover:text-[#d7a33a]"
            >
              Admin ↗
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />
          <span className="hidden max-w-[120px] truncate text-xs text-white/40 md:block" title={userEmail}>
            {displayName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
