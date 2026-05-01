import Link from 'next/link';
import { ArrowRight, FileText, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  // TODO: Obtener datos del usuario desde Supabase
  const userName = 'Cliente';

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      {/* Header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#07111d]">Mi panel</h1>
              <p className="mt-1 text-[#29384a]">Bienvenido, {userName}</p>
            </div>
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex items-center gap-2 rounded-lg bg-[#d7a33a] px-6 py-3 font-semibold text-[#061321] hover:bg-[#f0bf54]"
            >
              <ArrowRight className="h-4 w-4" />
              Nuevo presupuesto
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card: Presupuestos pendientes */}
          <Link
            href="/dashboard/presupuestos"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#d7a33a]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Presupuestos pendientes</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">0</p>
              </div>
              <div className="rounded-lg bg-[#d7a33a]/10 p-3 text-[#d7a33a]">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-[#d7a33a] group-hover:translate-x-1 transition">
              Ver presupuestos →
            </p>
          </Link>

          {/* Card: Servicios activos */}
          <Link
            href="/dashboard/mis-servicios"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#d7a33a]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Servicios contratados</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">0</p>
              </div>
              <div className="rounded-lg bg-[#1fae4b]/10 p-3 text-[#1fae4b]">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-[#d7a33a] group-hover:translate-x-1 transition">
              Ver servicios →
            </p>
          </Link>

          {/* Card: Facturas */}
          <Link
            href="/dashboard/facturas"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#d7a33a]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#29384a]">Facturas pendientes</p>
                <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">0</p>
              </div>
              <div className="rounded-lg bg-[#c88b25]/10 p-3 text-[#c88b25]">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-[#d7a33a] group-hover:translate-x-1 transition">
              Ver facturas →
            </p>
          </Link>
        </div>

        {/* Sección: Próximos pasos */}
        <div className="mt-12 rounded-2xl border border-[#d8cbb5] bg-white p-8">
          <h2 className="font-serif text-xl font-bold text-[#07111d]">Próximos pasos</h2>
          <div className="mt-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/10 text-[#d7a33a]">
                1
              </div>
              <div>
                <p className="font-semibold text-[#07111d]">Completa tu perfil</p>
                <p className="mt-1 text-sm text-[#29384a]">Añade más información para presupuestos más precisos</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/10 text-[#d7a33a]">
                2
              </div>
              <div>
                <p className="font-semibold text-[#07111d]">Solicita presupuesto</p>
                <p className="mt-1 text-sm text-[#29384a]">Recibirás propuestas personalizadas en 24 horas</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/10 text-[#d7a33a]">
                3
              </div>
              <div>
                <p className="font-semibold text-[#07111d]">Revisa y aprueba</p>
                <p className="mt-1 text-sm text-[#29384a]">Acepta el presupuesto y comenzamos el trámite</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
