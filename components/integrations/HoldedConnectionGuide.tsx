'use client';

const HOLDED_API_URL = process.env.NEXT_PUBLIC_HOLDED_API_DOCS_URL ?? 'https://developers.holded.com';

const STEPS = [
  {
    n: 1,
    title: 'Accede a la configuración de Holded',
    body: 'Inicia sesión en tu cuenta de Holded y ve a Configuración → Integraciones → API.',
  },
  {
    n: 2,
    title: 'Genera una nueva API key',
    body: 'Haz clic en "Nueva clave API". Asigna un nombre descriptivo (ej. "EXPERT Asesoría").',
  },
  {
    n: 3,
    title: 'Activa los permisos necesarios',
    body: 'Marca al menos: Facturas emitidas, Facturas recibidas, Impuestos. Opcionalmente activa Bancos para conciliación.',
  },
  {
    n: 4,
    title: 'Copia la clave y pégala aquí',
    body: 'La clave solo se muestra una vez en Holded. Pégala en el campo de abajo y haz clic en "Verificar y Conectar".',
  },
];

export function HoldedConnectionGuide() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#7a6e5f]">
        Necesitas una API key de Holded con permisos de lectura sobre facturas e impuestos.{' '}
        <a
          href={HOLDED_API_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#c88b25] underline-offset-2 hover:underline"
        >
          Ver documentación oficial →
        </a>
      </p>

      <ol className="space-y-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c88b25] text-xs font-bold text-white">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#3d3528]">{s.title}</p>
              <p className="mt-0.5 text-sm text-[#7a6e5f]">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="rounded-xl border border-[#e8dfc8] bg-[#fffdf7] px-4 py-3 text-xs text-[#7a6e5f]">
        Tu clave API se cifra con AES-256-GCM antes de guardarse. Nunca se envía por chat, email ni WhatsApp.
        Solo tú y el equipo de EXPERT podéis usarla para sincronizar tu contabilidad.
      </p>
    </div>
  );
}
