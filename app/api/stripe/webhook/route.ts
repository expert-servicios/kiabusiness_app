import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/integrations/stripe';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { syncOrderToHolded, syncSubscriptionToHolded } from '@/lib/integrations/holded';
import {
  holdedFormacionConfirmed,
  holdedMigrationConfirmed,
  paymentConfirmed,
  servicePaymentConfirmed,
  subscriptionCreated,
  subscriptionPaymentFailed
} from '@/lib/email/templates';

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

function getPlanName(priceId: string, fallback?: string | null): string {
  if (fallback) return fallback;

  const map: Record<string, string> = {
    [process.env.STRIPE_PLAN_MONTHLY_99 ?? '']: 'Plan Avanzado',
    [process.env.STRIPE_PLAN_MONTHLY_199 ?? '']: 'Plan Colaborativo',
    [process.env.STRIPE_PLAN_MONTHLY_349 ?? '']: 'Plan Presupuesto Personalizado'
  };
  return map[priceId] ?? 'Suscripción';
}

function getStripeCustomerId(customer: Stripe.Subscription['customer']): string | null {
  return typeof customer === 'string' ? customer : customer?.id ?? null;
}

function getAllowedSubscriptionStatus(status: Stripe.Subscription.Status) {
  const allowed = ['active', 'canceled', 'past_due', 'unpaid', 'trialing'] as const;
  return allowed.includes(status as (typeof allowed)[number]) ? status : null;
}

async function upsertSubscriptionFromStripe(
  supabaseAdmin: SupabaseAdmin,
  sub: Stripe.Subscription,
  userIdHint?: string | null
): Promise<{ clientId: string; planName: string; periodEnd: string | null } | null> {
  const customerId = getStripeCustomerId(sub.customer);
  const priceId = sub.items.data[0]?.price.id ?? '';
  const status = getAllowedSubscriptionStatus(sub.status);

  if (!customerId || !priceId || !status) {
    console.warn('[webhook] subscription skipped: unsupported or incomplete data', {
      subscription: sub.id,
      status: sub.status,
      hasCustomer: Boolean(customerId),
      hasPrice: Boolean(priceId)
    });
    return null;
  }

  let clientId = userIdHint ?? sub.metadata?.user_id ?? null;
  if (!clientId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    clientId = profile?.id ?? null;
  }

  if (!clientId) {
    console.error('[webhook] subscription has no resolvable EXPERT user', {
      subscription: sub.id,
      customer: customerId
    });
    return null;
  }

  const firstItem = sub.items.data[0];
  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null;
  const planName = getPlanName(priceId, sub.metadata?.plan_name);

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', clientId);
  if (profileError) {
    console.error('[webhook] profile stripe_customer_id update failed:', profileError);
  }

  const { error: subscriptionError } = await supabaseAdmin.from('subscriptions').upsert(
    {
      client_id: clientId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_name: planName,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'stripe_subscription_id' }
  );

  if (subscriptionError) {
    console.error('[webhook] subscription upsert failed:', subscriptionError);
    return null;
  }

  return { clientId, planName, periodEnd };
}

async function getClientEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return null;

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  return { email, name: profile?.full_name ?? email.split('@')[0] };
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error('Stripe webhook verify failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === 'payment') {
      const quoteId = session.client_reference_id ?? session.metadata?.quote_id;
      if (quoteId) {
        const { data: quote, error: quoteFetchError } = await supabaseAdmin
          .from('quotes')
          .select('client_id,lead_id,title,docs_checklist')
          .eq('id', quoteId)
          .single();

        if (!quote || quoteFetchError) {
          console.error('Quote not found for webhook:', quoteFetchError);
        } else {
          const amountEur = Number(session.amount_total ?? 0) / 100;
          const paymentId = (session.payment_intent as string) ?? session.id;
          const currency = session.currency?.toUpperCase() ?? 'EUR';

          // ── Idempotency: skip if order already exists for this payment ──
          const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_payment_id', paymentId)
            .maybeSingle();

          if (existingOrder) {
            console.log('[webhook] order already exists for payment', paymentId, '— skipping');
          } else {
            await supabaseAdmin
              .from('quotes')
              .update({ status: 'paid', stripe_checkout_id: session.id })
              .eq('id', quoteId);

            // ── Insert order ──
            const { data: newOrder, error: orderError } = await supabaseAdmin.from('orders').insert({
              quote_id: quoteId,
              client_id: quote.client_id,
              stripe_payment_id: paymentId,
              amount_eur: amountEur,
              currency,
              status: 'paid',
              metadata: {
                checkout_session: {
                  id: session.id,
                  payment_intent: session.payment_intent,
                  customer_email: session.customer_email
                }
              }
            }).select('id').single();

            if (orderError) {
              console.error('[webhook] order insert failed:', orderError);
            }

            if (quote.client_id) {
              const { data: existingCase } = await supabaseAdmin
                .from('cases')
                .select('id')
                .eq('quote_id', quoteId)
                .maybeSingle();

              if (!existingCase) {
                await supabaseAdmin.from('cases').insert({
                  quote_id: quoteId,
                  client_id: quote.client_id,
                  category: 'presupuesto',
                  service: quote.title ?? 'servicio',
                  state: Array.isArray(quote.docs_checklist) && quote.docs_checklist.length > 0 ? 'docs_pendientes' : 'nuevo',
                  docs_checklist: Array.isArray(quote.docs_checklist) ? quote.docs_checklist : []
                });
              }
            }

            const clientEmail =
              session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;

            if (clientEmail) {
              let clientName = clientEmail.split('@')[0];
              if (quote.client_id) {
                const info = await getClientEmail(quote.client_id);
                if (info) clientName = info.name;
              }

              const tpl = paymentConfirmed(clientName, amountEur, quote.title ?? 'Servicio contratado');
              await sendEmail({
                to: clientEmail,
                eventType: 'payment.confirmed',
                ...tpl,
                metadata: { quote_id: quoteId, session_id: session.id }
              });

              // Holded sync (non-blocking — errors don't affect main flow)
              syncOrderToHolded({
                clientName,
                clientEmail,
                description: quote.title ?? 'Servicio EXPERT',
                amountEur,
                orderId: newOrder?.id,
                localEntity: 'orders'
              }).then((result) => {
                if (result.invoiceId && newOrder?.id) {
                  supabaseAdmin.from('orders').update({
                    metadata: {
                      checkout_session: { id: session.id, payment_intent: session.payment_intent, customer_email: session.customer_email },
                      holded: {
                        contact_id: result.contactId,
                        invoice_id: result.invoiceId,
                        sync_event_id: result.syncEventId
                      }
                    }
                  }).eq('id', newOrder.id).then(() => {});
                }
              }).catch((err) => console.error('[webhook] holded sync failed:', err));
            }
          }
        }
      }
    }

    const productType = session.metadata?.product_type;
    if (session.mode === 'payment' && (productType === 'service' || productType === 'cart')) {
      const customerEmail = session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;
      const customerName =
        (session.customer_details as { name?: string } | null)?.name ??
        customerEmail?.split('@')[0] ??
        'Cliente';
      const serviceName =
        session.metadata?.service_name ??
        session.metadata?.service_names ??
        'Servicio EXPERT';
      const amountEur = Number(session.amount_total ?? 0) / 100;
      const paymentId  = (session.payment_intent as string) ?? session.id;

      // ── Idempotency: create order record for catalog payment ──
      const { data: existingCatalogOrder } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_payment_id', paymentId)
        .maybeSingle();

      let catalogOrderId: string | undefined;
      if (!existingCatalogOrder) {
        const { data: newCatalogOrder, error: catalogOrderError } = await supabaseAdmin
          .from('orders')
          .insert({
            source          : 'catalog',
            client_id       : session.client_reference_id ?? null,
            stripe_payment_id: paymentId,
            amount_eur      : amountEur,
            currency        : session.currency?.toUpperCase() ?? 'EUR',
            status          : 'paid',
            service_slugs   : session.metadata?.service_slugs ?? session.metadata?.service_slug ?? null,
            metadata        : {
              checkout_session: {
                id             : session.id,
                payment_intent : session.payment_intent,
                customer_email : customerEmail ?? null,
                product_type   : productType,
              },
            },
          })
          .select('id')
          .single();

        if (catalogOrderError) {
          console.error('[webhook] catalog order insert failed:', catalogOrderError);
        } else {
          catalogOrderId = newCatalogOrder?.id;
        }
      } else {
        catalogOrderId = existingCatalogOrder.id;
      }

      if (customerEmail) {
        const tpl = servicePaymentConfirmed(customerName, amountEur, serviceName);
        await sendEmail({
          to: customerEmail,
          eventType: 'service.payment.confirmed',
          ...tpl,
          metadata: {
            session_id: session.id,
            service_slug: session.metadata?.service_slug ?? session.metadata?.service_slugs ?? null
          }
        });

        syncOrderToHolded({
          clientName: customerName,
          clientEmail: customerEmail,
          description: serviceName,
          amountEur,
          orderId: catalogOrderId ?? session.id,
          localEntity: 'orders'
        }).catch((err) => console.error('[webhook] holded sync (catalog) failed:', err));
      }
    }

    if (productType === 'holded' || productType === 'holded_formacion') {
      const customerEmail = session.customer_email ?? (session.customer_details as { email?: string } | null)?.email;
      const customerName =
        (session.customer_details as { name?: string } | null)?.name ??
        customerEmail?.split('@')[0] ??
        'Cliente';

      if (customerEmail) {
        const calendlyFormacion = process.env.NEXT_PUBLIC_CALENDLY_FORMACION_URL ?? 'https://calendly.com/soy-kseniailicheva/formacion-holded';
        const holdedAmountEur = Number(session.amount_total ?? 0) / 100;
        if (productType === 'holded') {
          const packageName = session.metadata?.package_name ?? 'Paquete Holded';
          const tpl = holdedMigrationConfirmed(customerName, packageName, calendlyFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.migration.confirmed',
            ...tpl,
            metadata: { session_id: session.id, package_name: packageName }
          });
          // Holded sync — migración
          syncOrderToHolded({
            clientName: customerName,
            clientEmail: customerEmail,
            description: packageName,
            amountEur: holdedAmountEur,
            orderId: session.id,
            localEntity: 'stripe_checkout_sessions'
          }).catch((err) => console.error('[webhook] holded sync (migration) failed:', err));
        } else {
          const tpl = holdedFormacionConfirmed(customerName, calendlyFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.formacion.confirmed',
            ...tpl,
            metadata: { session_id: session.id }
          });
          // Holded sync — formación
          syncOrderToHolded({
            clientName: customerName,
            clientEmail: customerEmail,
            description: 'Formación EXPERT — sesión 2 h',
            amountEur: holdedAmountEur,
            orderId: session.id,
            localEntity: 'stripe_checkout_sessions'
          }).catch((err) => console.error('[webhook] holded sync (formacion) failed:', err));
        }
      }
    }

    if (session.mode === 'subscription') {
      const userId = session.client_reference_id ?? session.metadata?.user_id;
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriptionFromStripe(supabaseAdmin, subscription, userId);
      } else if (userId && session.customer) {
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer.id;
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }
    }
  }

  if (event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription;
    const subscriptionRecord = await upsertSubscriptionFromStripe(supabaseAdmin, sub);

    if (subscriptionRecord) {
      const clientInfo = await getClientEmail(subscriptionRecord.clientId);
      if (clientInfo) {
        const tpl = subscriptionCreated(clientInfo.name, subscriptionRecord.planName, subscriptionRecord.periodEnd);
        await sendEmail({
          to: clientInfo.email,
          eventType: 'subscription.created',
          ...tpl,
          metadata: { subscription_id: sub.id, plan: subscriptionRecord.planName }
        });

        const monthlyAmount = sub.items.data[0]?.price.unit_amount
          ? sub.items.data[0].price.unit_amount / 100
          : 0;
        syncSubscriptionToHolded({
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          planName: subscriptionRecord.planName,
          amountEur: monthlyAmount,
          subscriptionId: sub.id,
          localEntity: 'stripe_subscriptions'
        }).then((result) => {
          if (result.invoiceId) {
            supabaseAdmin.from('subscriptions').update({
              metadata: {
                holded: {
                  contact_id: result.contactId,
                  invoice_id: result.invoiceId,
                  sync_event_id: result.syncEventId
                }
              }
            }).eq('stripe_subscription_id', sub.id).then(() => {});
          }
        }).catch((err) => console.error('[webhook] holded sync (subscription) failed:', err));
      }
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const prevAttributes = event.data.previous_attributes as Record<string, unknown> | undefined;
    const prevStatus = prevAttributes?.status as string | undefined;

    const subscriptionRecord = await upsertSubscriptionFromStripe(supabaseAdmin, sub);

    if (sub.status === 'past_due' && prevStatus !== 'past_due') {
      const { data: dbSub } = await supabaseAdmin
        .from('subscriptions')
        .select('client_id,plan_name')
        .eq('stripe_subscription_id', sub.id)
        .maybeSingle();

      const clientId = subscriptionRecord?.clientId ?? dbSub?.client_id;
      const planName = subscriptionRecord?.planName ?? dbSub?.plan_name ?? 'Suscripción';

      if (clientId) {
        const clientInfo = await getClientEmail(clientId);
        if (clientInfo) {
          const tpl = subscriptionPaymentFailed(clientInfo.name, planName);
          await sendEmail({
            to: clientInfo.email,
            eventType: 'subscription.payment_failed',
            ...tpl,
            metadata: { subscription_id: sub.id }
          });
        }
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', sub.id);
  }

  return NextResponse.json({ received: true });
}
