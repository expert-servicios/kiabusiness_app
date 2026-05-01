import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Menu, MessageCircle } from 'lucide-react';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Sobre mí', href: '/sobre-mi' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' }
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#061321]/96 text-white shadow-lg shadow-black/10 backdrop-blur">
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
            <span className="block font-serif text-2xl font-bold leading-none tracking-[0.18em] text-white">EXPERT</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/56 sm:block">
              Experiencia · Compañía · Soluciones
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-white/88 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative inline-flex items-center gap-1 transition hover:text-[#d7a33a] ${
                link.href === '/' ? 'text-[#d7a33a]' : ''
              }`}
            >
              {link.label}
              {link.href === '/servicios' && <ChevronDown className="h-3.5 w-3.5" />}
              {link.href === '/' && <span className="absolute -bottom-4 left-0 h-[2px] w-full bg-[#d7a33a]" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="https://wa.me/34669045528"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d7a33a] px-5 text-sm font-bold text-[#061321] shadow-lg shadow-black/20 transition hover:bg-[#f0bf54]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Link>

          <details className="group relative lg:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-white/20 text-white/80 transition hover:border-[#d7a33a] hover:text-[#d7a33a] [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </summary>
            <div className="absolute right-0 top-14 w-64 border border-white/10 bg-[#061321] p-3 shadow-2xl shadow-black/30">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-3 text-sm font-semibold text-white/76 transition hover:bg-white/10 hover:text-[#d7a33a]"
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
