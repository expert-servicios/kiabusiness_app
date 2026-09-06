import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();
    if (profileError) return NextResponse.json({ error: 'No se pudo resolver la entidad activa' }, { status: 500 });
    if (!profile?.active_company_id) return NextResponse.json({ invoices: [], companyId: null });

    const { data: membership } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', user.id)
      .eq('company_id', profile.active_company_id)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: 'La entidad activa no pertenece a tu cuenta' }, { status: 403 });

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('id,razon_social,stripe_customer_id')
      .eq('id', profile.active_company_id)
      .maybeSingle();
    if (companyError) return NextResponse.json({ error: 'No se pudo cargar la facturación' }, { status: 500 });
    if (!company?.stripe_customer_id) {
      return NextResponse.json({ invoices: [], companyId: company?.id ?? profile.active_company_id, companyName: company?.razon_social ?? null });
    }

    const stripe = getStripeClient();
    const result = await stripe.invoices.list({ customer: company.stripe_customer_id, limit: 50 });
    const invoices = result.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number ?? null,
      status: invoice.status ?? null,
      amountDue: Number(invoice.amount_due ?? 0) / 100,
      amountPaid: Number(invoice.amount_paid ?? 0) / 100,
      amountRemaining: Number(invoice.amount_remaining ?? 0) / 100,
      currency: String(invoice.currency ?? 'eur').toUpperCase(),
      createdAt: new Date(invoice.created * 1000).toISOString(),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
    }));

    return NextResponse.json({ invoices, companyId: company.id, companyName: company.razon_social });
  } catch (error) {
    console.error('[billing/invoices]', error);
    return NextResponse.json({ error: 'No se pudieron cargar las facturas de Stripe' }, { status: 500 });
  }
}
