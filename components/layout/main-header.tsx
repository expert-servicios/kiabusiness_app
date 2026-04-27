const menu = ['Inicio', 'Servicios', 'Sobre mí', 'Blog', 'Contacto'];

export function MainHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-lightGold/20 bg-brand-navy/95 text-brand-cream backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-content-center rounded-full border border-brand-lightGold/50 text-lg font-serif text-brand-lightGold">FX</div>
          <div>
            <p className="font-serif text-2xl leading-none tracking-[0.3em]">EXPERT</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gray">Experiencia · Conocimiento · Soluciones</p>
          </div>
        </a>

        <nav className="hidden gap-8 md:flex">
          {menu.map((item) => (
            <a key={item} href="#" className="text-sm font-medium tracking-wide transition hover:text-brand-lightGold">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-full border border-brand-lightGold/70 px-4 py-2 text-sm font-medium md:block">
            Acceder
          </button>
          <button className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white">WhatsApp</button>
        </div>
      </div>
    </header>
  );
}
