'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center px-6 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error inesperado</h1>
          <p className="text-gray-600 mb-6">
            Ha ocurrido un error. Por favor, inténtalo de nuevo.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1B2D45] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
