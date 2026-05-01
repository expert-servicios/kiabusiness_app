import Link from 'next/link';
import { Users, FileText, DollarSign, BarChart3 } from 'lucide-react';

export default function AdminPage() {
  // TODO: Obtener estadísticas desde Supabase
  const stats = {
    totalUsers: 42,
    pendingQuotes: 8,
    totalRevenue: 15420,
    conversionRate: 62
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      {/* Header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="font-serif text-3xl font-bold text-[#07111d]">Panel de administración</h1>
          <p className="mt-1 text-[#29384a]">Gestión de usuarios, presupuestos y servicios</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Estadísticas */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Usuarios registrados</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{stats.totalUsers}</p>
              </div>
              <div className="rounded-lg bg-[#d7a33a]/10 p-3 text-[#d7a33a]">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Presupuestos pendientes</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{stats.pendingQuotes}</p>
              </div>
              <div className="rounded-lg bg-[#c88b25]/10 p-3 text-[#c88b25]">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Ingresos totales</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">${stats.totalRevenue}</p>
              </div>
              <div className="rounded-lg bg-[#1fae4b]/10 p-3 text-[#1fae4b]">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Tasa de conversión</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{stats.conversionRate}%</p>
              </div>
              <div className="rounded-lg bg-[#061321]/10 p-3 text-[#061321]">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Menú de gestión */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Link
            href="/admin/usuarios"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:shadow-md hover:border-[#d7a33a]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Usuarios</h3>
                <p className="mt-2 text-[#29384a]">Gestionar registros, roles y permisos</p>
              </div>
              <Users className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] group-hover:translate-x-1 transition">Ir a usuarios →</p>
          </Link>

          <Link
            href="/admin/presupuestos"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:shadow-md hover:border-[#d7a33a]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Presupuestos</h3>
                <p className="mt-2 text-[#29384a]">Revisar, aprobar y gestionar propuestas</p>
              </div>
              <FileText className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] group-hover:translate-x-1 transition">Ir a presupuestos →</p>
          </Link>

          <Link
            href="/admin/servicios"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:shadow-md hover:border-[#d7a33a]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Servicios</h3>
                <p className="mt-2 text-[#29384a]">Crear, editar y organizar servicios</p>
              </div>
              <FileText className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] group-hover:translate-x-1 transition">Ir a servicios →</p>
          </Link>

          <Link
            href="/admin/reportes"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:shadow-md hover:border-[#d7a33a]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Reportes</h3>
                <p className="mt-2 text-[#29384a]">Estadísticas, analytics y descargas</p>
              </div>
              <BarChart3 className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] group-hover:translate-x-1 transition">Ir a reportes →</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
