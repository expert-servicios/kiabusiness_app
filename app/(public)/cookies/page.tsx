import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Política de cookies para el sitio de EXPERT ESTUDIOS PROFESIONALES, SLU.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/cookies',
    title: 'Política de Cookies | EXPERT',
    description: 'Política de cookies para el sitio de EXPERT ESTUDIOS PROFESIONALES, SLU.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl">Política de Cookies</h1>
      <section className="mt-8 space-y-6 text-base leading-8 text-brand-slate">
        <p>Usamos cookies para mejorar la experiencia de navegación, analizar el uso del sitio y ofrecer funcionalidades personalizadas.</p>
        <div>
          <h2 className="font-semibold text-2xl">¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que los sitios web envían al navegador para guardar información sobre la visita.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Cookies utilizadas</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Cookies técnicas: necesarias para el funcionamiento del sitio.</li>
            <li>Cookies analíticas: miden el uso y rendimiento de la web.</li>
            <li>Cookies de preferencias: recuerdan elecciones del usuario.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Gestión y eliminación</h2>
          <p>Puedes desactivar o eliminar cookies desde la configuración de tu navegador. Ten en cuenta que esto puede afectar a algunas funciones del sitio.</p>
        </div>
      </section>
    </main>
  );
}
