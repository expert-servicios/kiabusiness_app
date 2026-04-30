import Link from 'next/link';
import { navLinks, siteName } from '@/config/brand';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-slate/20 bg-brand-navy/95 text-brand-cream backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl tracking-[-0.03em]">
          {siteName}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm transition hover:text-brand-lightGold">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-brand-gold px-4 py-2 text-sm text-brand-cream transition hover:bg-brand-gold hover:text-brand-navy"
          >
            Acceder / Registrarse
          </Link>
        </div>
      </div>
    </header>
  );
}
