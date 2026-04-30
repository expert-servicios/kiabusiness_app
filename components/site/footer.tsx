import Image from 'next/image';
import Link from 'next/link';
import { footerCopy, footerLinks, siteName } from '@/config/brand';

export function Footer() {
  return (
    <footer className="bg-brand-navy text-brand-cream">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image src="/logos/expert-logo.png" alt="EXPERT" width={140} height={40} className="h-auto w-auto" />
            </div>
            <p className="max-w-sm text-sm leading-7 text-brand-cream/80">{footerCopy}</p>
            <p className="text-sm font-semibold text-brand-lightGold">Holded Solution Partner</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-cream/70">Servicios</h3>
            <ul className="mt-6 space-y-3 text-sm text-brand-cream/80">
              {footerLinks.services.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-brand-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-cream/70">Empresa</h3>
            <ul className="mt-6 space-y-3 text-sm text-brand-cream/80">
              {footerLinks.company.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-brand-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-cream/70">Legal</h3>
            <ul className="mt-6 space-y-3 text-sm text-brand-cream/80">
              {footerLinks.legal.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-brand-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-cream/70">Contacto</h3>
            <ul className="mt-6 space-y-3 text-sm text-brand-cream/80">
              {footerLinks.contact.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-brand-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
