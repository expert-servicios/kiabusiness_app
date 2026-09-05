import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { isStaffRole } from '@/lib/auth/roles';

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive' || !isStaffRole(profile?.role)) return null;
  return admin;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireStaff(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const [profileRes, authRes, membershipsRes, casesRes, tasksRes, subsRes, checkoutsRes, ordersRes] = await Promise.all([
    admin.from('profiles').select('id,full_name,email,active_company_id,status').eq('id', clientId).single(),
    admin.auth.admin.getUserById(clientId),
    admin.from('profile_companies').select('company_id,company:companies(id,razon_social,nombre_comercial,cif_nif,stripe_customer_id,status)').eq('profile_id', clientId),
    admin.from('cases').select('id,service,category,state,status,priority,next_action,company_id,opened_at,updated_at').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(50),
    admin.from('internal_tasks').select('id,title,description,status,priority,due_date,case_id,source,created_at,updated_at').eq('client_id', clientId).order('due_date', { ascending: true, nullsFirst: false }).limit(50),
    admin.from('subscriptions').select('id,plan_name,status,company_id,current_period_start,current_period_end,canceled_at,stripe_subscription_id,created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(30),
    admin.from('checkout_sessions').select('id,stripe_session_id,status,company_id,metadata,created_at,updated_at').eq('user_id', clientId).order('created_at', { ascending: false }).limit(30),
    admin.from('orders').select('id,amount_eur,currency,status,source,company_id,stripe_session_id,stripe_payment_id,holded_invoice_id,holded_sync_error,created_at,service_slugs').or(`client_id.eq.${clientId},user_id.eq.${clientId}`).order('created_at', { ascending: false }).limit(50),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const companies = (membershipsRes.data ?? []).flatMap((row) => {
    const raw = row.company;
    const company = Array.isArray(raw) ? raw[0] : raw;
    return company ? [{
      id: company.id,
      name: company.razon_social || company.nombre_comercial || company.id,
      nif: company.cif_nif,
      stripeCustomerId: company.stripe_customer_id,
      status: company.status,
    }] : [];
  });
  const companyIds = companies.map((company) => company.id);
  const caseIds = (casesRes.data ?? []).map((item) => item.id);

  const [obligationsRes, integrationsRes, directDocsRes, caseDocsRes, companyDocsRes] = await Promise.all([
    companyIds.length
      ? admin.from('obligations_calendar').select('id,company_id,kind,due_date,status,attendees,created_at').in('company_id', companyIds).order('due_date', { ascending: true }).limit(100)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? admin.from('client_integrations').select('id,provider,status,sync_mode,company_id,last_sync_at,last_success_at,last_error,permissions_enabled,permissions_detected').or(`client_id.eq.${clientId},company_id.in.(${companyIds.join(',')})`).order('updated_at', { ascending: false })
      : admin.from('client_integrations').select('id,provider,status,sync_mode,company_id,last_sync_at,last_success_at,last_error,permissions_enabled,permissions_detected').eq('client_id', clientId).order('updated_at', { ascending: false }),
    admin.from('documents').select('id,company_id,case_id,kind,state,created_at').eq('client_id', clientId),
    caseIds.length
      ? admin.from('documents').select('id,company_id,case_id,kind,state,created_at').in('case_id', caseIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? admin.from('documents').select('id,company_id,case_id,kind,state,created_at').in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const docMap = new Map<string, { id: string; company_id: string | null; case_id: string | null; kind: string | null; state: string | null; created_at: string }>();
  for (const result of [directDocsRes, caseDocsRes, companyDocsRes]) {
    for (const row of result.data ?? []) {
      if (row.kind !== 'internal') docMap.set(row.id, row);
    }
  }
  const documents = Array.from(docMap.values());

  const stripe = getStripeClient();
  const stripeInvoices: Array<{
    id: string;
    companyId: string;
    companyName: string;
    number: string | null;
    status: string | null;
    amountDue: number;
    amountPaid: number;
    currency: string;
    createdAt: string;
    periodStart: string | null;
    periodEnd: string | null;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
  }> = [];
  const stripeErrors: Array<{ companyId: string; message: string }> = [];

  for (const company of companies) {
    if (!company.stripeCustomerId) continue;
    try {
      const invoices = await stripe.invoices.list({ customer: company.stripeCustomerId, limit: 30 });
      for (const invoice of invoices.data) {
        stripeInvoices.push({
          id: invoice.id,
          companyId: company.id,
          companyName: company.name,
          number: invoice.number ?? null,
          status: invoice.status ?? null,
          amountDue: Number(invoice.amount_due ?? 0) / 100,
          amountPaid: Number(invoice.amount_paid ?? 0) / 100,
          currency: String(invoice.currency ?? 'eur').toUpperCase(),
          createdAt: new Date(invoice.created * 1000).toISOString(),
          periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
          invoicePdf: invoice.invoice_pdf ?? null,
        });
      }
    } catch (error) {
      stripeErrors.push({
        companyId: company.id,
        message: error instanceof Error ? error.message.slice(0, 180) : 'No se pudieron leer las facturas Stripe',
      });
    }
  }
  stripeInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const email = authRes.data.user?.email ?? profileRes.data.email ?? '';
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = (tasksRes.data ?? []).filter((task) => task.status === 'pendiente' || task.status === 'en_progreso');
  const openCases = (casesRes.data ?? []).filter((item) => item.state !== 'finalizado');
  const activeSubs = (subsRes.data ?? []).filter((sub) => sub.status === 'active' || sub.status === 'trialing');
  const activeIntegrations = (integrationsRes.data ?? []).filter((item) => item.status === 'active');

  return NextResponse.json({
    client: {
      id: clientId,
      name: profileRes.data.full_name ?? email,
      email,
      activeCompanyId: profileRes.data.active_company_id,
      status: profileRes.data.status,
    },
    companies,
    summary: {
      openTasks: openTasks.length,
      overdueTasks: openTasks.filter((task) => task.due_date && task.due_date < today).length,
      openCases: openCases.length,
      activeSubscriptions: activeSubs.length,
      documents: documents.length,
      pendingDocuments: documents.filter((doc) => doc.state === 'pendiente').length,
      obligations: (obligationsRes.data ?? []).length,
      activeIntegrations: activeIntegrations.length,
      stripeInvoices: stripeInvoices.length,
      localOrders: (ordersRes.data ?? []).length,
    },
    tasks: tasksRes.data ?? [],
    cases: casesRes.data ?? [],
    subscriptions: subsRes.data ?? [],
    checkoutSessions: checkoutsRes.data ?? [],
    orders: ordersRes.data ?? [],
    obligations: obligationsRes.data ?? [],
    integrations: integrationsRes.data ?? [],
    documents: documents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    stripeInvoices,
    stripeErrors,
  });
}
