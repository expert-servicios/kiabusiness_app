const menu = ['Inicio', 'Servicios', 'Sobre mí', 'Blog', 'Contacto'];

export function MainHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-slate/20 bg-brand-navy text-brand-cream">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <p className="font-serif text-2xl">EXPERT</p>
        <nav className="hidden gap-6 md:flex">
          {menu.map((item) => (
            <a key={item} href="#" className="text-sm hover:text-brand-lightGold">
              {item}
            </a>
          ))}
        </nav>
        <div className="flex gap-3">
          <button className="rounded-full border border-brand-lightGold px-4 py-2 text-sm">Acceder / Registrarse</button>
          <button className="rounded-full bg-brand-gold px-4 py-2 text-sm text-brand-navy">WhatsApp</button>
        </div>
      </div>
    </header>
  );
}
