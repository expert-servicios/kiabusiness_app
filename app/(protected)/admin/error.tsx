'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">🔧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error en el panel</h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'No se pudo cargar esta sección del panel de administración.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1B2D45] transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/admin"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Panel principal
          </a>
        </div>
      </div>
    </div>
  );
}
