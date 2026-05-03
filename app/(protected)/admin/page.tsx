import Link from 'next/link';
import { cookies } from 'next/headers';
import { Users, FileText, DollarSign, BarChart3, FolderOpen } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  pendingQuotes: number;
  activeCases: number;
  totalRevenue: number;
}

async function getAdminStats(): Promise<AdminStats> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return { totalUsers: 0, pendingQuotes: 0, activeCases: 0, totalRevenue: 0 };
  return response.json();
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="font-serif text-3xl font-bold text-[#07111d]">Panel de administración</h1>
          <p className="mt-1 text-[#29384a]">Gestión de usuarios, presupuestos y expedientes</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
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
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">
                  €{stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg bg-[#1fae4b]/10 p-3 text-[#1fae4b]">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Expedientes activos</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{stats.activeCases}</p>
              </div>
              <div className="rounded-lg bg-[#061321]/10 p-3 text-[#061321]">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Link
            href="/admin/presupuestos"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Presupuestos</h3>
                <p className="mt-2 text-[#29384a]">Revisar, aprobar y gestionar propuestas</p>
              </div>
              <FileText className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] transition group-hover:translate-x-1">Ir a presupuestos →</p>
          </Link>

          <Link
            href="/admin/expedientes"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Expedientes</h3>
                <p className="mt-2 text-[#29384a]">Gestionar casos, estados y documentos</p>
              </div>
              <FolderOpen className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] transition group-hover:translate-x-1">Ir a expedientes →</p>
          </Link>

          <Link
            href="/admin/usuarios"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Usuarios</h3>
                <p className="mt-2 text-[#29384a]">Gestionar registros, roles y permisos</p>
              </div>
              <Users className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] transition group-hover:translate-x-1">Ir a usuarios →</p>
          </Link>

          <Link
            href="/admin/reportes"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#07111d]">Reportes</h3>
                <p className="mt-2 text-[#29384a]">Estadísticas, analytics y descargas</p>
              </div>
              <BarChart3 className="h-8 w-8 text-[#d7a33a]" />
            </div>
            <p className="mt-6 font-semibold text-[#d7a33a] transition group-hover:translate-x-1">Ir a reportes →</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
