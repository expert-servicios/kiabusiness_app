import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { legacyOrderFields } from '@/lib/payments/non-academy-order';

const APPLY_CONFIRMATION = 'IMPORTAR_HISTORIAL_STRIPE';
const MAX_CUSTOMERS = 500;

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile, error } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (error || !['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return user;
}

interface SyncStats {
  customers: { total: number; linked: number; lead_created: number; skipped: number; conflicts: number; errors: number };
  invoices: { total: number; created: number; skipped: number; errors: number };
  subs: { total: number; created: number; updated: number; skipped: number; errors: number };
}

interface SyncProblem {
  scope: 'customer' | 'invoice' | 'subscription';
  external_id: string;
  message: string;
}

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return String(error);
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const stripe = getStripeClient();
    const admin = getSupabaseAdmin();
    const [stripeCustomers, expertProfiles, expertOrders, expertSubs, linkedProfiles] = await Promise.all([
      stripe.customers.list({ limit: 1 }),
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('orders').select('id', { count: 'exact', head: true }),
      admin.from('subscriptions').select('id', { count: 'exact', head: true }),
      admin.from('profiles').select('id', { count: 'exact', head: true }).not('stripe_customer_id', 'is', null),
    ]);

    for (const result of [expertProfiles, expertOrders, expertSubs, linkedProfiles]) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({
      stripe: { total_customers: stripeCustomers.data.length > 0 ? '≥1 (previsualiza para obtener el total)' : 0 },
      expert: {
        profiles: expertProfiles.count ?? 0,
        profiles_linked: linkedProfiles.count ?? 0,
        orders: expertOrders.count ?? 0,
        subscriptions: expertSubs.count ?? 0,
      },
    });
  } catch (error) {
    console.error('[stripe history status]', error);
    return NextResponse.json({ error: 'Error al obtener el estado de Stripe' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  let body: { dryRun?: boolean; limit?: number; confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud JSON no válida' }, { status: 400 });
  }

  const dryRun = body.dryRun !== false;
  const requestedLimit = Number.isFinite(body.limit) ? Math.trunc(body.limit as number) : MAX_CUSTOMERS;
  const maxCustomers = Math.min(MAX_CUSTOMERS, Math.max(1, requestedLimit));

  if (!dryRun && body.confirmation !== APPLY_CONFIRMATION) {
    return NextResponse.json({ error: 'Falta la confirmación expresa para importar el historial' }, { status: 400 });
  }

  const stats: SyncStats = {
    customers: { total: 0, linked: 0, lead_created: 0, skipped: 0, conflicts: 0, errors: 0 },
    invoices: { total: 0, created: 0, skipped: 0, errors: 0 },
    subs: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
  };
  const problems: SyncProblem[] = [];

  try {
    const stripe = getStripeClient();
    const admin = getSupabaseAdmin();
    const authUsers = await listAllAuthUsers();
    const authEmailToId = new Map(
      authUsers.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u.id])
    );

    const customers: Stripe.Customer[] = [];
    for await (const customer of stripe.customers.list({ limit: 100 })) {
      if (customers.length >= maxCustomers) break;
      customers.push(customer);
    }
    stats.customers.total = customers.length;

    const emailFrequency = new Map<string, number>();
    for (const customer of customers) {
      if (customer.email) {
        const email = customer.email.toLowerCase();
        emailFrequency.set(email, (emailFrequency.get(email) ?? 0) + 1);
      }
    }

    const plans: Array<{ customer: Stripe.Customer; profileId: string | null; conflict: string | null }> = [];
    for (const customer of customers) {
      let profileId: string | null = customer.metadata?.user_id ?? null;
      if (!profileId && customer.email) profileId = authEmailToId.get(customer.email.toLowerCase()) ?? null;

      let conflict: string | null = null;
      if (customer.email && (emailFrequency.get(customer.email.toLowerCase()) ?? 0) > 1) {
        conflict = 'Hay varios clientes Stripe con el mismo email';
      }

      if (profileId) {
        const { data: profile, error } = await admin
          .from('profiles')
          .select('id,stripe_customer_id')
          .eq('id', profileId)
          .maybeSingle();
        if (error) {
          problems.push({ scope: 'customer', external_id: customer.id, message: error.message });
          stats.customers.errors++;
          profileId = null;
        } else if (!profile) {
          profileId = null;
        } else if (profile.stripe_customer_id && profile.stripe_customer_id !== customer.id) {
          conflict = 'El perfil ya está vinculado a otro cliente Stripe';
        } else {
          const { data: linkedElsewhere, error: reverseLookupError } = await admin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customer.id)
            .neq('id', profileId)
            .limit(1);
          if (reverseLookupError) {
            problems.push({ scope: 'customer', external_id: customer.id, message: reverseLookupError.message });
            stats.customers.errors++;
          } else if ((linkedElsewhere?.length ?? 0) > 0) {
            conflict = 'El cliente Stripe ya está vinculado a otro perfil';
          }
        }
      }

      if (conflict) stats.customers.conflicts++;
      plans.push({ customer, profileId, conflict });
    }

    if (!dryRun && (stats.customers.conflicts > 0 || stats.customers.errors > 0)) {
      return NextResponse.json({
        dryRun,
        stats,
        problems: [
          ...problems,
          ...plans
            .filter((plan) => plan.conflict)
            .map((plan) => ({ scope: 'customer' as const, external_id: plan.customer.id, message: plan.conflict ?? 'Conflicto de vinculación' })),
        ].slice(0, 100),
        error: 'Importación detenida: el preflight detectó conflictos o errores. Revisión manual obligatoria.',
      }, { status: 409 });
    }

    for (const { customer, profileId, conflict } of plans) {
      if (conflict) {
        stats.customers.skipped++;
        continue;
      }

      if (profileId) {
        if (dryRun) {
          stats.customers.linked++;
        } else {
          const { data, error } = await admin
            .from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', profileId)
            .select('id')
            .single();
          if (error || !data) {
            stats.customers.errors++;
            problems.push({ scope: 'customer', external_id: customer.id, message: error?.message ?? 'El perfil no se actualizó' });
          } else {
            stats.customers.linked++;
          }
        }
      } else if (customer.email) {
        const { data: existingLeads, error: lookupError } = await admin
          .from('leads')
          .select('id')
          .ilike('email', customer.email)
          .limit(2);
        if (lookupError) {
          stats.customers.errors++;
          problems.push({ scope: 'customer', external_id: customer.id, message: lookupError.message });
        } else if ((existingLeads?.length ?? 0) > 1) {
          stats.customers.conflicts++;
          stats.customers.skipped++;
          problems.push({ scope: 'customer', external_id: customer.id, message: 'Hay varios leads con el mismo email' });
        } else if ((existingLeads?.length ?? 0) === 1) {
          stats.customers.skipped++;
        } else if (dryRun) {
          stats.customers.lead_created++;
        } else {
          const { data, error } = await admin.from('leads').insert({
            phone: customer.phone ?? null,
            name: customer.name ?? customer.email.split('@')[0],
            email: customer.email,
            source: 'stripe_import',
            notes: `Importado desde Stripe customer ${customer.id}`,
            updated_at: new Date().toISOString(),
          }).select('id').single();
          if (error || !data) {
            stats.customers.errors++;
            problems.push({ scope: 'customer', external_id: customer.id, message: error?.message ?? 'El lead no se creó' });
          } else {
            stats.customers.lead_created++;
          }
        }
      } else {
        stats.customers.skipped++;
      }

      for await (const invoice of stripe.invoices.list({ customer: customer.id, limit: 100, status: 'paid' })) {
        stats.invoices.total++;
        const paymentIntent = (invoice as unknown as { payment_intent?: string | Stripe.PaymentIntent | null }).payment_intent;
        const paymentId = typeof paymentIntent === 'string'
          ? paymentIntent
          : (paymentIntent?.id ?? invoice.id);

        const { data: existing, error: lookupError } = await admin
          .from('orders')
          .select('id')
          .eq('stripe_payment_id', paymentId)
          .maybeSingle();
        if (lookupError) {
          stats.invoices.errors++;
          problems.push({ scope: 'invoice', external_id: invoice.id, message: lookupError.message });
          continue;
        }
        if (existing) {
          stats.invoices.skipped++;
          continue;
        }

        if (dryRun) {
          stats.invoices.created++;
          continue;
        }

        const amountEur = (invoice.amount_paid ?? 0) / 100;
        const description = invoice.lines.data[0]?.description ?? invoice.description ?? 'Factura Stripe importada';
        const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;
        const { data, error } = await admin.from('orders').insert({
          client_id: profileId,
          stripe_payment_id: paymentId,
          amount_eur: amountEur,
          ...legacyOrderFields(amountEur, description),
          currency: (invoice.currency ?? 'eur').toUpperCase(),
          status: 'paid',
          source: 'stripe_import',
          created_at: new Date(paidAt * 1000).toISOString(),
          metadata: {
            stripe_invoice_id: invoice.id,
            stripe_customer_id: customer.id,
            description,
            imported_at: new Date().toISOString(),
          },
        }).select('id').single();

        if (error || !data) {
          stats.invoices.errors++;
          problems.push({ scope: 'invoice', external_id: invoice.id, message: error?.message ?? 'La orden no se creó' });
        } else {
          stats.invoices.created++;
        }
      }

      for await (const sub of stripe.subscriptions.list({ customer: customer.id, limit: 100, status: 'all' })) {
        stats.subs.total++;
        if (!profileId) {
          stats.subs.skipped++;
          continue;
        }

        const item = sub.items.data[0];
        const priceId = item?.price.id;
        const status = (['active', 'canceled', 'past_due', 'unpaid', 'trialing'] as const).find((value) => value === sub.status);
        if (!priceId || !status) {
          stats.subs.skipped++;
          continue;
        }

        const row = {
          client_id: profileId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: customer.id,
          stripe_price_id: priceId,
          plan_name: sub.metadata?.plan_name ?? item.price.nickname ?? 'Suscripción EXPERT',
          status,
          current_period_start: item.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : null,
          current_period_end: item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        };

        const { data: existing, error: lookupError } = await admin
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle();
        if (lookupError) {
          stats.subs.errors++;
          problems.push({ scope: 'subscription', external_id: sub.id, message: lookupError.message });
          continue;
        }

        if (dryRun) {
          if (existing) stats.subs.updated++;
          else stats.subs.created++;
          continue;
        }

        const query = existing
          ? admin.from('subscriptions').update(row).eq('stripe_subscription_id', sub.id)
          : admin.from('subscriptions').insert(row);
        const { data, error } = await query.select('id').single();
        if (error || !data) {
          stats.subs.errors++;
          problems.push({ scope: 'subscription', external_id: sub.id, message: error?.message ?? 'La suscripción no se guardó' });
        } else if (existing) {
          stats.subs.updated++;
        } else {
          stats.subs.created++;
        }
      }
    }

    const hasErrors = problems.length > 0 || stats.customers.conflicts > 0;
    return NextResponse.json(
      {
        dryRun,
        stats,
        problems: problems.slice(0, 100),
        error: hasErrors ? 'La sincronización terminó con incidencias. Revisa el detalle antes de repetirla.' : undefined,
      },
      { status: hasErrors ? 409 : 200 }
    );
  } catch (error) {
    console.error('[stripe history sync]', error);
    return NextResponse.json({
      dryRun,
      stats,
      problems,
      error: `La sincronización se detuvo: ${messageOf(error)}`,
    }, { status: 500 });
  }
}