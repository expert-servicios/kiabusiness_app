export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0D1B2A]" />
        <p className="text-sm text-gray-500">Cargando…</p>
      </div>
    </div>
  );
}
