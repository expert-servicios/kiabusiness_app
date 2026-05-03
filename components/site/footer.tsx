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
    <footer className="bg-[#0D1B2A] py-10 text-[#F8F6F1]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-9 px-6 md:grid-cols-[1.25fr_0.75fr_0.9fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center">
            <span className="relative flex h-20 w-56 shrink-0 items-center justify-start overflow-hidden sm:h-24 sm:w-72">
              <Image
                src="/logos/expert-logo-light-clean.png"
                alt="Logo EXPERT"
                fill
                sizes="(min-width: 640px) 288px, 224px"
                className="object-contain object-left"
              />
            </span>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-6 text-[#9CA3AF]">
            Asesoría fiscal, legal y administrativa para residentes, expatriados y empresas en España.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#F8F6F1]">Navegación</h3>
          <ul className="space-y-2 text-sm text-[#9CA3AF]">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-[#D4A017]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#F8F6F1]">Servicios</h3>
          <ul className="space-y-2 text-sm text-[#9CA3AF]">
            {serviceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-[#D4A017]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#F8F6F1]">Contacto</h3>
          <ul className="space-y-3 text-sm text-[#9CA3AF]">
            <li className="flex gap-3">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
              <span>+34 696 55 04 80</span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
              <span>soy@kseniailicheva.com</span>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
              <span>España</span>
            </li>
          </ul>
          <div className="mt-4 flex gap-3 text-sm font-bold text-[#9CA3AF]">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#F8F6F1]/20">IG</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#F8F6F1]/20">in</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-4 border-t border-[#D4A017]/35 px-6 pt-5 text-xs text-[#9CA3AF] md:flex-row">
        <p>© 2026 EXPERT | Todos los derechos reservados</p>
        <div className="flex gap-4">
          <Link href="/aviso-legal" className="transition hover:text-[#D4A017]">Aviso legal</Link>
          <Link href="/privacidad" className="transition hover:text-[#D4A017]">Política de privacidad</Link>
          <Link href="/cookies" className="transition hover:text-[#D4A017]">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
