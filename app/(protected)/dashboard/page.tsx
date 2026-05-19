import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  AlertCircle, ArrowRight, Building2, CheckCircle2,
  ChevronRight, Clock, FileText, FolderOpen, MessageCircle, Plus, Zap
} from 'lucide-react';

async function fetchWithCookies(path: string) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const STATE_LABELS: Record<string, string> = {
  pendiente_documentacion: 'Pendiente de documentación',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  presentado: 'Presentado',
  finalizado: 'Finalizado'
};

const STATE_CONFIG: Record<string, { color: string; bg: string; icon: string; nextAction: string }> = {
  pendiente_documentacion: {
    color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200',
    icon: '⚠️', nextAction: 'Sube los documentos solicitados para avanzar'
  },
  en_revision: {
    color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200',
    icon: '🔍', nextAction: 'Estamos revisando tu documentación'
  },
  en_proceso: {
    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200',
    icon: '⚙️', nextAction: 'Tu trámite está en curso'
  },
  presentado: {
    color: 'text-green-700', bg: 'bg-green-50 border-green-200',
    icon: '✅', nextAction: 'Presentado ante el organismo competente'
  },
  finalizado: {
    color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200',
    icon: '✓', nextAction: 'Trámite completado'
  }
};

interface CaseItem { id: string; service: string; state: string; opened_at: string; unread_count: number }
interface QuoteItem { id: string; status: string; amount_eur: number; service?: string }
interface SubItem { status: string }

function getPrimaryAction(
  cases: CaseItem[],
  quotes: QuoteItem[],
  hasCompany: boolean
): { title: string; desc: string; href: string; urgent: boolean } | null {
  const needsDocs = cases.find((c) => c.state === 'pendiente_documentacion');
  if (needsDocs) return {
    title: 'Documentación pendiente',
    desc: `Tu expediente "${needsDocs.service}" necesita que subas documentos para continuar.`,
    href: `/dashboard/expedientes/${needsDocs.id}`,
    urgent: true
  };

  const pendingQuote = quotes.find((q) => q.status === 'sent' && q.amount_eur > 0);
  if (pendingQuote) return {
    title: 'Tienes un presupuesto pendiente de aprobación',
    desc: `Revisa la propuesta y apruébala para iniciar tu trámite.`,
    href: '/dashboard/presupuestos',
    urgent: true
  };

  if (!hasCompany) return {
    title: 'Completa el perfil de tu empresa',
    desc: 'Añade tus datos fiscales para gestionar expedientes, suscripciones y facturas.',
    href: '/dashboard/empresa/nueva',
    urgent: false
  };

  return null;
}

export default async function DashboardPage() {
  const [quotesData, casesData, subsData, companiesData, profileData] = await Promise.all([
    fetchWithCookies('/api/quotes'),
    fetchWithCookies('/api/cases'),
    fetchWithCookies('/api/subscriptions'),
    fetchWithCookies('/api/companies'),
    fetchWithCookies('/api/profile')
  ]);

  const quotes: QuoteItem[] = quotesData?.quotes ?? [];
  const cases: CaseItem[] = casesData?.cases ?? [];
  const subscriptions: SubItem[] = subsData?.subscriptions ?? [];
  const hasCompany = (companiesData?.companies?.length ?? 0) > 0;
  const profile = profileData?.profile ?? null;
  const firstName = profile?.full_name?.split(' ')[0] ?? null;

  const activeCases = cases.filter((c) => c.state !== 'finalizado');
  const pendingQuotes = quotes.filter((q) => q.status === 'sent' && q.amount_eur > 0);
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const totalUnread = cases.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  const primaryAction = getPrimaryAction(cases, quotes, hasCompany);

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      {/* Page header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-7">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#07111d] md:text-3xl">
              {firstName ? `Hola, ${firstName}` : 'Mi panel'}
            </h1>
            <p className="mt-1 text-sm text-[#29384a]">Tu área privada de EXPERT</p>
          </div>
          <Link
            href="/solicitar-presupuesto"
            className="inline-flex items-center gap-2 rounded-lg bg-[#d7a33a] px-4 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo presupuesto</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">

        {/* ── PRÓXIMA ACCIÓN (dynamic) ── */}
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className={`flex items-start justify-between gap-4 rounded-2xl border p-5 transition hover:shadow-md sm:items-center ${
              primaryAction.urgent
                ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                : 'border-[#d7a33a]/40 bg-[#d7a33a]/5 hover:border-[#d7a33a]/60'
            }`}
          >
            <div className="flex items-start gap-4 sm:items-center">
              <div className={`mt-0.5 shrink-0 sm:mt-0 ${primaryAction.urgent ? 'text-amber-500' : 'text-[#d7a33a]'}`}>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className={`font-semibold ${primaryAction.urgent ? 'text-amber-800' : 'text-[#07111d]'}`}>
                  {primaryAction.title}
                </p>
                <p className="mt-0.5 text-sm text-[#29384a]">{primaryAction.desc}</p>
              </div>
            </div>
            <ArrowRight className={`h-5 w-5 shrink-0 ${primaryAction.urgent ? 'text-amber-500' : 'text-[#d7a33a]'}`} />
          </Link>
        ) : (
          activeCases.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Todo al día — no tienes acciones pendientes</p>
            </div>
          )
        )}

        {/* ── UNREAD MESSAGES BANNER ── */}
        {totalUnread > 0 && (
          <Link
            href="/dashboard/expedientes"
            className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 shrink-0 text-blue-600" />
              <p className="text-sm font-semibold text-blue-800">
                Tienes {totalUnread} mensaje{totalUnread !== 1 ? 's' : ''} sin leer de tu asesor
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
          </Link>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Link
            href="/dashboard/expedientes"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <FolderOpen className="h-5 w-5 text-[#c88b25]" />
              <p className="font-serif text-3xl font-bold text-[#07111d]">{activeCases.length}</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#29384a]">Expedientes activos</p>
            <p className="mt-1 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-1">
              Ver expedientes →
            </p>
          </Link>

          <Link
            href="/dashboard/presupuestos"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-[#c88b25]" />
              <p className="font-serif text-3xl font-bold text-[#07111d]">{pendingQuotes.length}</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#29384a]">Presupuestos pendientes</p>
            <p className="mt-1 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-1">
              Ver presupuestos →
            </p>
          </Link>

          <Link
            href="/dashboard/suscripciones"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-[#c88b25]" />
              <p className="font-serif text-3xl font-bold text-[#07111d]">{activeSubscriptions.length}</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#29384a]">Suscripciones activas</p>
            <p className="mt-1 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-1">
              Ver planes →
            </p>
          </Link>
        </div>

        {/* ── EXPEDIENTES ACTIVOS ── */}
        {activeCases.length > 0 && (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#d8cbb5] px-6 py-4">
              <h2 className="font-serif text-base font-bold text-[#07111d]">Expedientes en curso</h2>
              <Link
                href="/dashboard/expedientes"
                className="text-xs font-semibold text-[#c88b25] transition hover:text-[#d7a33a]"
              >
                Ver todos →
              </Link>
            </div>
            <ul className="divide-y divide-[#f0e8d8]">
              {activeCases.slice(0, 4).map((c) => {
                const cfg = STATE_CONFIG[c.state] ?? STATE_CONFIG.en_proceso;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/expedientes/${c.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#faf7f0]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#07111d]">{c.service}</p>
                        <p className="mt-0.5 text-xs text-[#29384a]">
                          {cfg.nextAction}
                          {c.unread_count > 0 && (
                            <span className="ml-2 inline-flex items-center gap-0.5 font-semibold text-blue-600">
                              <MessageCircle className="h-3 w-3" />
                              {c.unread_count} nuevo{c.unread_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ${cfg.bg} ${cfg.color}`}>
                          {STATE_LABELS[c.state] ?? c.state}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#c88b25]" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── ESTADO VACÍO (sin nada todavía) ── */}
        {activeCases.length === 0 && pendingQuotes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-[#d8cbb5]" />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#07111d]">Aún no tienes trámites</h2>
            <p className="mt-2 text-sm text-[#29384a]">
              Solicita un presupuesto y en menos de 24 horas hábiles recibirás una propuesta personalizada.
            </p>
            <Link
              href="/solicitar-presupuesto"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#d7a33a] px-6 py-3 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54]"
            >
              Solicitar presupuesto <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ── SETUP EMPRESA ── */}
        {!hasCompany && (
          <div className="flex flex-col gap-4 rounded-2xl border border-[#d7a33a]/30 bg-[#d7a33a]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-[#d7a33a]/15 p-2.5 text-[#d7a33a]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[#07111d]">Datos de empresa pendientes</p>
                <p className="mt-0.5 text-sm text-[#29384a]">
                  Necesarios para gestionar expedientes, suscripciones y facturación.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/empresa/nueva"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#d7a33a] px-4 py-2 text-sm font-semibold text-[#061321] transition hover:bg-[#f0bf54]"
            >
              <Plus className="h-4 w-4" />
              Añadir empresa
            </Link>
          </div>
        )}

        {/* ── PLAN CTA (si no tiene suscripción activa) ── */}
        {activeSubscriptions.length === 0 && activeCases.length > 0 && (
          <div className="rounded-2xl border border-[#d7a33a]/20 bg-white p-6">
            <div className="flex items-start gap-4">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-[#d7a33a]" />
              <div>
                <p className="font-semibold text-[#07111d]">¿Necesitas gestión mensual continua?</p>
                <p className="mt-1 text-sm text-[#29384a]">
                  Con nuestros planes gestionamos todos tus trámites fiscales y administrativos cada mes.
                </p>
                <Link
                  href="/planes"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#c88b25] underline underline-offset-4 transition hover:text-[#d7a33a]"
                >
                  Ver planes desde 99 €/mes <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
