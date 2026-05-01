import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, MessageCircle } from 'lucide-react';

const quickLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Sobre mí', href: '/sobre-mi' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' }
] as const;

const serviceLinks = [
  { label: 'Declaraciones e Impuestos', href: '/servicios/declaraciones-impuestos' },
  { label: 'Extranjería y Nacionalidad', href: '/servicios/extranjeria-nacionalidad' },
  { label: 'Empresas y Autónomos', href: '/servicios/empresas-autonomos' },
  { label: 'Gestiones Especializadas', href: '/servicios/gestiones-especializadas' }
] as const;

export function Footer() {
  return (
    <footer className="bg-[#061321] py-9 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-9 px-6 md:grid-cols-[1.25fr_0.75fr_0.9fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden">
              <Image src="/logos/expert-mark-light-clean.png" alt="" fill sizes="56px" className="object-contain" />
            </span>
            <span>
              <span className="block font-serif text-3xl font-bold leading-none tracking-[0.18em]">EXPERT</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/56">
                Experiencia · Compañía · Soluciones
              </span>
            </span>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Asesoría fiscal, legal y administrativa para residentes, expatriados y empresas en España.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Navegación</h3>
          <ul className="space-y-2 text-sm text-white/60">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-[#d7a33a]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Servicios</h3>
          <ul className="space-y-2 text-sm text-white/60">
            {serviceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-[#d7a33a]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Contacto</h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex gap-3">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d7a33a]" />
              <span>+34 669 04 55 28</span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#d7a33a]" />
              <span>soy@kseniailicheva.com</span>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d7a33a]" />
              <span>España</span>
            </li>
          </ul>
          <div className="mt-4 flex gap-3 text-sm font-bold text-white/70">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/20">IG</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/20">in</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-4 border-t border-[#d7a33a]/35 px-6 pt-5 text-xs text-white/50 md:flex-row">
        <p>© 2026 EXPERT | Todos los derechos reservados</p>
        <div className="flex gap-4">
          <Link href="/legal/aviso-legal">Aviso legal</Link>
          <Link href="/legal/privacidad">Política de privacidad</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
