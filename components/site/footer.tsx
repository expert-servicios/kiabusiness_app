import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, MessageCircle } from 'lucide-react';

const quickLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Planes', href: '/planes' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Holded', href: '/holded' },
  { label: 'Formación', href: '/servicios/formacion' },
  { label: 'Sobre mí', href: '/sobre-mi' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Para asesorias', href: '/para-asesorias' }
] as const;

const serviceLinks = [
  { label: 'Declaraciones e Impuestos', href: '/servicios/declaraciones-impuestos' },
  { label: 'Extranjería y Nacionalidad', href: '/servicios/extranjeria-nacionalidad' },
  { label: 'Empresas y Autónomos', href: '/servicios/empresas-autonomos' },
  { label: 'Gestiones Especializadas', href: '/servicios/gestiones-especializadas' },
  { label: 'Formación', href: '/servicios/formacion' }
] as const;

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ksenia-ilicheva/',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/expert_servicios/',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    )
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/expertapp',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCua-wKjSBBVOuIXI-wWzpJg',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
] as const;

export function Footer() {
  return (
    <footer className="bg-[#0D1B2A] py-10 text-[#F8F6F1]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-9 px-6 md:grid-cols-[1.25fr_0.75fr_0.9fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center">
            <span className="relative flex h-36 w-full shrink-0 items-center justify-start overflow-hidden sm:h-44">
              <Image
                src="/logos/EXPERT_logo/expert-logo-light-clean.png"
                alt="Logo EXPERT"
                fill
                sizes="(min-width: 640px) 320px, 256px"
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
              <a href="tel:+34696550480" className="transition hover:text-[#D4A017]">+34 696 55 04 80</a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
              <a href="mailto:soy@kseniailicheva.com" className="transition hover:text-[#D4A017]">soy@kseniailicheva.com</a>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
              <span>España</span>
            </li>
          </ul>

          <div className="mt-5 flex gap-2">
            {socialLinks.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-[#9CA3AF] transition hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-4 border-t border-[#D4A017]/30 px-6 pt-5 text-xs text-[#9CA3AF] md:flex-row">
        <p>© 2026 EXPERT | Todos los derechos reservados</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/aviso-legal" className="transition hover:text-[#D4A017]">Aviso legal</Link>
          <Link href="/privacidad" className="transition hover:text-[#D4A017]">Política de privacidad</Link>
          <Link href="/terminos" className="transition hover:text-[#D4A017]">Términos</Link>
          <Link href="/cookies" className="transition hover:text-[#D4A017]">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
