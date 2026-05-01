import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="absolute left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#06111f]/35 text-white backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/branding/logos/expert-logo-dark.png"
            alt="EXPERT"
            width={190}
            height={64}
            priority
            className="h-auto w-[170px] md:w-[190px]"
          />
        </Link>

        <nav className="hidden items-center gap-9 text-sm font-semibold uppercase tracking-wide text-white/85 lg:flex">
          <Link href="/" className="relative text-[#F2C14E]">
            Inicio
            <span className="absolute -bottom-3 left-0 h-[2px] w-full bg-[#D4A017]" />
          </Link>
          <Link href="/servicios" className="hover:text-[#F2C14E]">Servicios</Link>
          <Link href="/sobre-mi" className="hover:text-[#F2C14E]">Sobre mí</Link>
          <Link href="/blog" className="hover:text-[#F2C14E]">Blog</Link>
          <Link href="/contacto" className="hover:text-[#F2C14E]">Contacto</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl border border-[#D4A017]/60 px-4 py-2 text-sm font-semibold text-[#F2C14E] transition hover:bg-[#D4A017] hover:text-[#0D1B2A] md:inline-flex"
          >
            Acceder / Registrarse
          </Link>

          <Link
            href="https://wa.me/34669045528"
            className="rounded-xl bg-[#D4A017] px-4 py-2 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-black/20 transition hover:bg-[#F2C14E]"
          >
            WhatsApp
          </Link>
        </div>
      </div>
    </header>
  );
}
