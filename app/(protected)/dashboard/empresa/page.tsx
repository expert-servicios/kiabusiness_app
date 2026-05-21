import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Building2, Check, Plus, Pencil } from 'lucide-react';
import { CompanyEditForm } from './CompanyEditForm';
import { absoluteAppUrl } from '@/lib/utils/app-url';

interface Company {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  cif_nif: string | null;
  forma_juridica: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  pais: string;
  telefono: string | null;
  email: string | null;
  web: string | null;
  role: string;
}

const FORMA_LABELS: Record<string, string> = {
  autonomo: 'Autónomo/a', sl: 'Sociedad Limitada (SL)', sa: 'Sociedad Anónima (SA)',
  slne: 'SL Nueva Empresa', cb: 'Comunidad de Bienes', cooperativa: 'Cooperativa',
  fundacion: 'Fundación', otra: 'Otra'
};

async function getData() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const [profileRes, companiesRes] = await Promise.all([
    fetch(absoluteAppUrl('/api/profile'), { headers: { cookie: cookieHeader }, cache: 'no-store' }),
    fetch(absoluteAppUrl('/api/companies'), { headers: { cookie: cookieHeader }, cache: 'no-store' })
  ]);

  const profileData = profileRes.ok ? await profileRes.json() : null;
  const companiesData = companiesRes.ok ? await companiesRes.json() : null;

  return {
    activeCompanyId: profileData?.profile?.active_company_id ?? null,
    companies: (companiesData?.companies ?? []) as Company[]
  };
}

export default async function EmpresaPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; edit?: string }>
}) {
  const { created, edit } = await searchParams;
  const { companies, activeCompanyId } = await getData();

  const editingId = edit ?? activeCompanyId;
  const editingCompany = companies.find((c) => c.id === editingId) ?? companies[0] ?? null;

  if (companies.length === 0) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f8f4eb] px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d7a33a]/10 text-[#d7a33a]">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">Añade tu primera empresa</h1>
          <p className="mt-3 text-sm leading-6 text-[#29384a]">
            Configura los datos fiscales de tu empresa o actividad para poder gestionar expedientes, suscripciones y facturación.
          </p>
          <Link
            href="/dashboard/empresa/nueva"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-6 py-3 font-semibold text-[#061321] transition hover:bg-[#f0bf54]"
          >
            <Plus className="h-4 w-4" />
            Añadir empresa
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </Link>
          <Link
            href="/dashboard/empresa/nueva"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d7a33a]/50 px-4 py-2 text-sm font-semibold text-[#c88b25] transition hover:bg-[#d7a33a]/8"
          >
            <Plus className="h-4 w-4" />
            Nueva empresa
          </Link>
        </div>

        {created && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            Empresa creada correctamente y configurada como activa.
          </div>
        )}

        {/* Company list (if more than one) */}
        {companies.length > 1 && (
          <div className="mb-6 rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#29384a]">Mis empresas</p>
            <div className="space-y-2">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/empresa?edit=${c.id}`}
                  className={`flex items-center gap-3 rounded-xl p-3 transition hover:bg-[#f8f4eb] ${editingId === c.id ? 'bg-[#f8f4eb] ring-1 ring-[#d7a33a]/40' : ''}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d7a33a]/10 text-[#d7a33a]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[#07111d]">{c.razon_social}</p>
                    <p className="text-xs text-[#29384a]">{FORMA_LABELS[c.forma_juridica] ?? c.forma_juridica}{c.cif_nif ? ` · ${c.cif_nif}` : ''}</p>
                  </div>
                  {c.id === activeCompanyId && (
                    <span className="rounded-full bg-[#d7a33a]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#c88b25]">Activa</span>
                  )}
                  <Pencil className="h-3.5 w-3.5 text-[#9ca3af]" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Edit form */}
        {editingCompany && (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-xl bg-[#d7a33a]/10 p-3 text-[#d7a33a]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c88b25]">Datos fiscales</p>
                <h1 className="mt-0.5 font-serif text-2xl font-bold text-[#07111d]">{editingCompany.razon_social}</h1>
              </div>
            </div>
            <CompanyEditForm company={editingCompany} />
          </div>
        )}
      </div>
    </main>
  );
}
