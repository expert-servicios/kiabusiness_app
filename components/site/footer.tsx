import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#06111f] py-12 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <Image
            src="/branding/logos/expert-logo-dark.svg"
            alt="EXPERT"
            width={210}
            height={80}
            className="h-auto w-[210px]"
          />

          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Asesoría fiscal, legal y administrativa en España para empresas, autónomos y personas físicas.
          </p>

          <p className="mt-3 font-semibold text-[#D4A017]">Holded Solution Partner</p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Enlaces rápidos</h3>
          <ul className="space-y-2 text-sm text-white/65">
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/servicios">Servicios</Link></li>
            <li><Link href="/sobre-mi">Sobre mí</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Servicios</h3>
          <ul className="space-y-2 text-sm text-white/65">
            <li><Link href="/servicios/declaraciones-impuestos">Declaraciones e Impuestos</Link></li>
            <li><Link href="/servicios/extranjeria-nacionalidad">Extranjería y Nacionalidad</Link></li>
            <li><Link href="/servicios/empresas-autonomos">Empresas y Autónomos</Link></li>
            <li><Link href="/servicios/gestiones-especializadas">Gestiones Especializadas</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Contacto</h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li>WhatsApp: +34 669 04 55 28</li>
            <li>Email: soy@kseniailicheva.com</li>
            <li>España</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 px-6 pt-6 text-xs text-white/45 md:flex-row">
        <p>© 2024 EXPERT. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <Link href="/legal/aviso-legal">Aviso legal</Link>
          <Link href="/legal/privacidad">Política de privacidad</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
