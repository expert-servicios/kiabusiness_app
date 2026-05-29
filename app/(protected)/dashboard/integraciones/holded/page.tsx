import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plug } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { HoldedConnectionCard } from '@/components/integrations/HoldedConnectionCard';

const SAFE_COLUMNS = 'id,provider,mode,api_key_last4,permissions_detected,status,sync_mode,last_sync_at,last_success_at,last_error,connected_by,disconnected_at,created_at,updated_at';

async function getIntegrationData(userId: string) {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('active_company_id')
    .eq('id', userId)
    .single();

  const companyId = profile?.active_company_id ?? null;

  let query = admin
    .from('client_integrations')
    .select(SAFE_COLUMNS)
    .eq('provider', 'holded')
    .neq('status', 'revoked')
    .order('created_at', { ascending: false })
    .limit(1);

  if (companyId) {
    query = query.eq('company_id', companyId);
  } else {
    query = query.eq('client_id', userId);
  }

  const { data: rows } = await query;

  return { integration: rows?.[0] ?? null, companyId };
}

export default async function HoldedIntegrationPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { integration, companyId } = await getIntegrationData(user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#7a6e5f] hover:text-[#3d3528]"
      >
        <ArrowLeft size={14} />
        Volver al panel
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c88b25]/10">
          <Plug size={18} className="text-[#c88b25]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#3d3528]">Integración con Holded</h1>
          <p className="text-sm text-[#7a6e5f]">Conecta tu cuenta de Holded para sincronizar tu contabilidad</p>
        </div>
      </div>

      {/* What you get */}
      {!integration && (
        <div className="mb-6 rounded-2xl border border-[#e8dfc8] bg-[#faf9f6] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6e5f]">
            Qué consigues al conectar Holded
          </p>
          <ul className="space-y-2 text-sm text-[#3d3528]">
            {[
              'Informe de IVA por trimestre y estimación del Modelo 303',
              'Balance de situación y cuenta de pérdidas y ganancias',
              'Movimientos bancarios y conciliación con cobros de Stripe',
              'Asientos contables y libro diario con detección de anomalías',
              'Facturas emitidas y recibidas accesibles desde el panel',
              'Consultas sobre contactos, productos, proyectos y empleados',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88b25]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-[#e8dfc8] bg-white p-6 shadow-sm">
        <HoldedConnectionCard
          integration={integration as Parameters<typeof HoldedConnectionCard>[0]['integration']}
          companyId={companyId}
        />
      </div>

      {/* Legal note */}
      <p className="mt-6 text-xs text-[#a89880]">
        EXPERT accede a tu Holded en modo solo lectura. Nunca modificamos tu contabilidad sin tu confirmación explícita.
        La API key se almacena cifrada con AES-256-GCM y no se comparte con terceros.
      </p>
    </main>
  );
}
