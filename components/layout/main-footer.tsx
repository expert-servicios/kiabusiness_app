export function MainFooter() {
  return (
    <footer className="hero-gradient border-t border-brand-lightGold/20 px-6 py-14 text-brand-cream">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div>
          <p className="font-serif text-3xl tracking-[0.3em]">EXPERT</p>
          <p className="mt-2 text-xs uppercase tracking-[0.15em] text-brand-gray">Experiencia · Conocimiento · Soluciones</p>
        </div>
        <div>
          <h3 className="font-serif text-xl">Enlaces rápidos</h3>
          <ul className="mt-3 space-y-2 text-brand-gray">
            <li>Inicio</li>
            <li>Servicios</li>
            <li>Sobre mí</li>
            <li>Blog</li>
            <li>Contacto</li>
          </ul>
        </div>
        <div>
          <h3 className="font-serif text-xl">Servicios</h3>
          <ul className="mt-3 space-y-2 text-brand-gray">
            <li>Declaración de la Renta</li>
            <li>Modelo 151</li>
            <li>Nacionalidad Española</li>
          </ul>
        </div>
        <div>
          <h3 className="font-serif text-xl">Contacto</h3>
          <ul className="mt-3 space-y-2 text-brand-gray">
            <li>+34 669 04 55 28</li>
            <li>soy@kseniailicheva.com</li>
            <li>España</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t border-brand-lightGold/20 pt-6 text-xs text-brand-gray md:flex-row">
        <p>© 2026 Ksenia Ilicheva - Asesoría Fiscal. Todos los derechos reservados.</p>
        <p>Aviso legal · Política de privacidad · Política de cookies</p>
      </div>
    </footer>
  );
}
