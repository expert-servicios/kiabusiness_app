import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, LockKeyhole, Menu } from 'lucide-react';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Holded', href: '/holded' },
  { label: 'Formación', href: '/servicios/formacion' },
  { label: 'Sobre mí', href: '/sobre-mi' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' }
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#F8F6F1]/10 bg-[#0D1B2A]/96 text-[#F8F6F1] shadow-lg shadow-[#0D1B2A]/20 backdrop-blur">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/logos/expert-mark-light-clean.png"
              alt=""
              fill
              sizes="48px"
              priority
              className="object-contain"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-2xl font-bold leading-none tracking-[0.18em] text-[#F8F6F1]">EXPERT</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF] sm:block">
              HOLDED SOLUTION PARTNER
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#F8F6F1]/88 xl:gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative inline-flex items-center gap-1 transition hover:text-[#D4A017] ${
                link.href === '/' ? 'text-[#D4A017]' : ''
              }`}
            >
              {link.label}
              {link.href === '/servicios' && <ChevronDown className="h-3.5 w-3.5" />}
              {link.href === '/' && <span className="absolute -bottom-4 left-0 h-[2px] w-full bg-[#D4A017]" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#0D1B2A]/25 transition hover:bg-[#F2C14E]"
          >
            <LockKeyhole className="h-4 w-4" />
            Acceder
          </Link>

          <details className="group relative lg:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-[#F8F6F1]/20 text-[#F8F6F1]/80 transition hover:border-[#D4A017] hover:text-[#D4A017] [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </summary>
            <div className="absolute right-0 top-14 w-64 border border-[#F8F6F1]/10 bg-[#0D1B2A] p-3 shadow-2xl shadow-[#0D1B2A]/40">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-3 text-sm font-semibold text-[#F8F6F1]/76 transition hover:bg-[#23364D] hover:text-[#D4A017]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
