'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LockKeyhole, Menu, X } from 'lucide-react';
import { categories } from '@/lib/utils/catalog';

const navLinks = [
  { label: 'Holded', href: '/holded' },
  { label: 'Formación', href: '/servicios/formacion' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Reservar cita', href: '/cita' }
] as const;

const planesLinks = [
  { label: 'Ver todos los planes', href: '/planes', highlight: true },
  { label: 'Plan Gratuito — Holded demo', href: '/planes/gratuito' },
  { label: 'Plan Avanzado — 99 €/mes', href: '/planes/avanzado' },
  { label: 'Plan Colaborativo — 199 €/mes', href: '/planes/colaborativo' },
  { label: 'Presupuesto personalizado', href: '/planes/presupuesto-personalizado' }
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [planesOpen, setPlanesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const planesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
      if (planesDropdownRef.current && !planesDropdownRef.current.contains(e.target as Node)) {
        setPlanesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
    setServicesOpen(false);
    setPlanesOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0D1B2A] text-[#F8F6F1] shadow-lg shadow-[#0D1B2A]/20">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" onClick={closeMobile} className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/logos/EXPERT_logo/expert-mark-light-clean.png"
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#F8F6F1]/88 lg:flex xl:gap-7">
          <Link href="/" className="transition hover:text-[#D4A017]">Inicio</Link>

          {/* Servicios dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => { setServicesOpen((v) => !v); setPlanesOpen(false); }}
              className="inline-flex items-center gap-1 transition hover:text-[#D4A017]"
              aria-expanded={servicesOpen ? 'true' : 'false'}
            >
              Servicios
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>

            {servicesOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 border border-white/10 bg-[#0D1B2A] shadow-2xl shadow-black/40">
                <Link
                  href="/servicios"
                  onClick={() => setServicesOpen(false)}
                  className="block border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#D4A017] hover:bg-[#23364D]"
                >
                  Ver todos los servicios →
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/servicios/${cat.slug}`}
                    onClick={() => setServicesOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#F8F6F1]/80 transition hover:bg-[#23364D] hover:text-[#D4A017]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Planes dropdown */}
          <div className="relative" ref={planesDropdownRef}>
            <button
              type="button"
              onClick={() => { setPlanesOpen((v) => !v); setServicesOpen(false); }}
              className="inline-flex items-center gap-1 transition hover:text-[#D4A017]"
              aria-expanded={planesOpen}
            >
              Planes
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${planesOpen ? 'rotate-180' : ''}`} />
            </button>

            {planesOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 border border-white/10 bg-[#0D1B2A] shadow-2xl shadow-black/40">
                {planesLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setPlanesOpen(false)}
                    className={link.highlight
                      ? 'block border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#D4A017] hover:bg-[#23364D]'
                      : 'block px-4 py-2.5 text-sm text-[#F8F6F1]/80 transition hover:bg-[#23364D] hover:text-[#D4A017]'
                    }
                  >
                    {link.highlight ? `${link.label} →` : link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={link.href === '/cita'
                ? 'rounded-md border border-[#D4A017]/50 px-3 py-1.5 text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017]/10'
                : 'transition hover:text-[#D4A017]'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#D4A017] px-4 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#0D1B2A]/25 transition hover:bg-[#F2C14E] sm:px-5"
          >
            <LockKeyhole className="h-4 w-4" />
            <span className="hidden sm:inline">Acceder</span>
          </Link>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 text-[#F8F6F1]/80 transition hover:border-[#D4A017] hover:text-[#D4A017] lg:hidden"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen ? 'true' : 'false'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0D1B2A] lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <Link
              href="/"
              onClick={closeMobile}
              className="block rounded-md px-3 py-3 text-sm font-semibold text-[#F8F6F1]/80 transition hover:bg-[#23364D] hover:text-[#D4A017]"
            >
              Inicio
            </Link>

            {/* Mobile Servicios accordion */}
            <div>
              <button
                type="button"
                onClick={() => setServicesOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-semibold text-[#F8F6F1]/80 transition hover:bg-[#23364D] hover:text-[#D4A017]"
              >
                Servicios
                <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="ml-3 border-l border-[#D4A017]/30 pl-3">
                  <Link
                    href="/servicios"
                    onClick={closeMobile}
                    className="block py-2 text-xs font-bold uppercase tracking-widest text-[#D4A017]"
                  >
                    Ver todos →
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/servicios/${cat.slug}`}
                      onClick={closeMobile}
                      className="block py-2 text-sm text-[#F8F6F1]/70 transition hover:text-[#D4A017]"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Planes accordion */}
            <div>
              <button
                type="button"
                onClick={() => setPlanesOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-semibold text-[#F8F6F1]/80 transition hover:bg-[#23364D] hover:text-[#D4A017]"
              >
                Planes
                <ChevronDown className={`h-4 w-4 transition-transform ${planesOpen ? 'rotate-180' : ''}`} />
              </button>
              {planesOpen && (
                <div className="ml-3 border-l border-[#D4A017]/30 pl-3">
                  {planesLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobile}
                      className={link.highlight
                        ? 'block py-2 text-xs font-bold uppercase tracking-widest text-[#D4A017]'
                        : 'block py-2 text-sm text-[#F8F6F1]/70 transition hover:text-[#D4A017]'
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="block rounded-md px-3 py-3 text-sm font-semibold text-[#F8F6F1]/80 transition hover:bg-[#23364D] hover:text-[#D4A017]"
              >
                {link.label}
              </Link>
            ))}

            {/* Acceder button in mobile menu */}
            <div className="mt-3 border-t border-white/10 pt-3">
              <Link
                href="/auth/login"
                onClick={closeMobile}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#D4A017] px-4 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                <LockKeyhole className="h-4 w-4" />
                Acceder a mi panel
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
