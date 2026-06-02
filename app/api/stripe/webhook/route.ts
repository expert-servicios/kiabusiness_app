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
    [process.env.STRIPE_PLAN_MONTHLY_49 ?? '']: 'Plan Supervisión',
    [process.env.STRIPE_PLAN_MONTHLY_99 ?? '']: 'Plan Avanzado',
    [process.env.STRIPE_PLAN_MONTHLY_199 ?? '']: 'Plan Colaborativo',
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

// ── IMP-005: Durable Holded job queue helpers ─────────────────────────────────

async function enqueueHoldedSync(
  supabaseAdmin: SupabaseAdmin,
  jobType: string,
  metadata: Record<string, unknown>,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('holded_sync_jobs')
    .insert({ job_type: jobType, status: 'queued', attempts: 0, metadata })
    .select('id')
    .single();
  if (error) {
    console.error('[holded queue] enqueue failed:', error.message);
    return null;
  }
  return data?.id ?? null;
}

async function resolveHoldedJob(
  supabaseAdmin: SupabaseAdmin,
  jobId: string | null,
  status: 'success' | 'failed',
  errorMsg?: string,
): Promise<void> {
  if (!jobId) return;
  await supabaseAdmin.from('holded_sync_jobs').update({
    status,
    finished_at: new Date().toISOString(),
    attempts: 1,
    ...(errorMsg ? { error: errorMsg.slice(0, 500) } : {}),
  }).eq('id', jobId);
}

// ── Order Holded trace helper ─────────────────────────────────────────────────

async function updateOrderHoldedResult(
  supabaseAdmin: SupabaseAdmin,
  orderId: string | undefined,
  result: { contactId: string | null; invoiceId: string | null; syncEventId: string | null; error?: string },
  baseMetadata: Record<string, unknown> = {}
) {
  if (!orderId) return;

  const holded = {
    contact_id: result.contactId,
    invoice_id: result.invoiceId,
    sync_event_id: result.syncEventId,
    error: result.error ?? null
  };

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: result.invoiceId ? 'paid' : 'paid_invoice_error',
      holded_invoice_id: result.invoiceId,
      holded_sync_event_id: result.syncEventId,
      holded_sync_error: result.error ?? null,
      holded_synced_at: new Date().toISOString(),
      metadata: { ...baseMetadata, holded }
    })
    .eq('id', orderId);

  if (error) {
    console.error('[webhook] holded order trace update failed:', error);
  }
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

  // ── IMP-004: Event-level idempotency guard ────────────────────────────────
  // Stripe retries webhooks for up to 3 days. We record the event_id before
  // any processing so that concurrent or repeated deliveries are rejected
  // atomically (unique constraint → code 23505 → return 200 immediately).
  const { error: dedupError } = await supabaseAdmin
    .from('stripe_processed_events')
    .insert({ event_id: event.id, event_type: event.type });

  if (dedupError) {
    if (dedupError.code === '23505') {
      console.log('[stripe webhook] duplicate event', event.id, '— already processed, skipping');
      return NextResponse.json({ received: true });
    }
    // Log but don't block: dedup failure is non-fatal (better to process twice
    // than to silently drop a payment event)
    console.error('[stripe webhook] event dedup insert failed:', dedupError.message);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === 'payment') {
      // client_reference_id is now user.id for catalog payments — use metadata.quote_id only
      const quoteId = session.metadata?.quote_id ?? null;
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
            const orderMetadata = {
              checkout_session: {
                id: session.id,
                payment_intent: session.payment_intent,
                customer_email: session.customer_email
              }
            };

            const { data: newOrder, error: orderError } = await supabaseAdmin.from('orders').insert({
              quote_id: quoteId,
              client_id: quote.client_id,
              stripe_payment_id: paymentId,
              amount_eur: amountEur,
              currency,
              status: 'paid',
              metadata: orderMetadata
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

              // IMP-005: enqueue job BEFORE the async call so it survives
              // if the serverless function is killed before .then() runs.
              const quoteJobId = await enqueueHoldedSync(supabaseAdmin, 'sync_order_holded', {
                clientName, clientEmail,
                description: quote.title ?? 'Servicio EXPERT',
                amountEur, orderId: newOrder?.id, localEntity: 'orders',
              });
              syncOrderToHolded({
                clientName,
                clientEmail,
                description: quote.title ?? 'Servicio EXPERT',
                amountEur,
                orderId: newOrder?.id,
                localEntity: 'orders'
              }).then((result) => {
                void resolveHoldedJob(supabaseAdmin, quoteJobId, 'success');
                updateOrderHoldedResult(supabaseAdmin, newOrder?.id, result, orderMetadata).catch((err) => {
                  console.error('[webhook] holded trace update failed:', err);
                });
              }).catch((err) => {
                console.error('[webhook] holded sync failed:', err);
                void resolveHoldedJob(supabaseAdmin, quoteJobId, 'failed', err instanceof Error ? err.message : String(err));
                updateOrderHoldedResult(
                  supabaseAdmin,
                  newOrder?.id,
                  { contactId: null, invoiceId: null, syncEventId: null, error: err instanceof Error ? err.message : String(err) },
                  orderMetadata
                ).catch(() => {});
              });
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
      let catalogOrderMetadata: Record<string, unknown> = {
        checkout_session: {
          id             : session.id,
          payment_intent : session.payment_intent,
          customer_email : customerEmail ?? null,
          product_type   : productType,
        },
      };

      // ── Idempotency: create order record for catalog payment ──
      const { data: existingCatalogOrder } = await supabaseAdmin
        .from('orders')
        .select('id,metadata')
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
            metadata        : catalogOrderMetadata,
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
        catalogOrderMetadata = (existingCatalogOrder.metadata ?? catalogOrderMetadata) as Record<string, unknown>;
      }

      if (customerEmail) {
        const slugsRaw = session.metadata?.service_slugs ?? session.metadata?.service_slug ?? '';
        const slugList = slugsRaw.split(',').map((s: string) => s.trim());
        const holdedPackageSlugs = ['holded-pack-starter', 'holded-migracion-sin-inventario', 'holded-migracion-con-inventario'];
        const isHoldedMigration = slugList.some((s: string) => holdedPackageSlugs.includes(s));
        const isHoldedFormacion = slugList.includes('holded-modulo-formacion');
        const calendlyFormacion = process.env.NEXT_PUBLIC_CALENDLY_FORMACION_URL ?? 'https://calendly.com/soy-kseniailicheva/formacion-holded';

        if (isHoldedMigration) {
          const packageName = serviceName;
          const tpl = holdedMigrationConfirmed(customerName, packageName, calendlyFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.migration.confirmed',
            ...tpl,
            metadata: { session_id: session.id, package_name: packageName }
          });
        } else if (isHoldedFormacion) {
          const tpl = holdedFormacionConfirmed(customerName, calendlyFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.formacion.confirmed',
            ...tpl,
            metadata: { session_id: session.id }
          });
        } else {
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
        }

        const catalogJobId = await enqueueHoldedSync(supabaseAdmin, 'sync_order_holded', {
          clientName: customerName, clientEmail: customerEmail,
          description: serviceName, amountEur,
          orderId: catalogOrderId ?? session.id, localEntity: 'orders',
        });
        syncOrderToHolded({
          clientName: customerName,
          clientEmail: customerEmail,
          description: serviceName,
          amountEur,
          orderId: catalogOrderId ?? session.id,
          localEntity: 'orders'
        }).then((result) => {
          void resolveHoldedJob(supabaseAdmin, catalogJobId, 'success');
          updateOrderHoldedResult(supabaseAdmin, catalogOrderId, result, catalogOrderMetadata).catch((err) => {
            console.error('[webhook] holded trace update (catalog) failed:', err);
          });
        }).catch((err) => {
          console.error('[webhook] holded sync (catalog) failed:', err);
          void resolveHoldedJob(supabaseAdmin, catalogJobId, 'failed', err instanceof Error ? err.message : String(err));
          updateOrderHoldedResult(
            supabaseAdmin,
            catalogOrderId,
            { contactId: null, invoiceId: null, syncEventId: null, error: err instanceof Error ? err.message : String(err) },
            catalogOrderMetadata
          ).catch(() => {});
        });
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
          // IMP-005: queue first, then fire-and-forget
          void enqueueHoldedSync(supabaseAdmin, 'sync_holded_migration', {
            clientName: customerName, clientEmail: customerEmail,
            description: packageName, amountEur: holdedAmountEur,
            orderId: session.id, localEntity: 'stripe_checkout_sessions',
          }).then((migJobId) => {
            syncOrderToHolded({
              clientName: customerName, clientEmail: customerEmail,
              description: packageName, amountEur: holdedAmountEur,
              orderId: session.id, localEntity: 'stripe_checkout_sessions',
            }).then(() => resolveHoldedJob(supabaseAdmin, migJobId, 'success'))
              .catch((err) => {
                console.error('[webhook] holded sync (migration) failed:', err);
                return resolveHoldedJob(supabaseAdmin, migJobId, 'failed', err instanceof Error ? err.message : String(err));
              });
          });
        } else {
          const tpl = holdedFormacionConfirmed(customerName, calendlyFormacion);
          await sendEmail({
            to: customerEmail,
            eventType: 'holded.formacion.confirmed',
            ...tpl,
            metadata: { session_id: session.id }
          });
          // IMP-005: queue first, then fire-and-forget
          void enqueueHoldedSync(supabaseAdmin, 'sync_holded_formacion', {
            clientName: customerName, clientEmail: customerEmail,
            description: 'Formación EXPERT — sesión 2 h', amountEur: holdedAmountEur,
            orderId: session.id, localEntity: 'stripe_checkout_sessions',
          }).then((formJobId) => {
            syncOrderToHolded({
              clientName: customerName, clientEmail: customerEmail,
              description: 'Formación EXPERT — sesión 2 h', amountEur: holdedAmountEur,
              orderId: session.id, localEntity: 'stripe_checkout_sessions',
            }).then(() => resolveHoldedJob(supabaseAdmin, formJobId, 'success'))
              .catch((err) => {
                console.error('[webhook] holded sync (formacion) failed:', err);
                return resolveHoldedJob(supabaseAdmin, formJobId, 'failed', err instanceof Error ? err.message : String(err));
              });
          });
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
        const subJobId = await enqueueHoldedSync(supabaseAdmin, 'sync_subscription_holded', {
          clientName: clientInfo.name, clientEmail: clientInfo.email,
          planName: subscriptionRecord.planName, amountEur: monthlyAmount,
          subscriptionId: sub.id, localEntity: 'stripe_subscriptions',
        });
        syncSubscriptionToHolded({
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          planName: subscriptionRecord.planName,
          amountEur: monthlyAmount,
          subscriptionId: sub.id,
          localEntity: 'stripe_subscriptions'
        }).then((result) => {
          void resolveHoldedJob(supabaseAdmin, subJobId, 'success');
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
        }).catch((err) => {
          console.error('[webhook] holded sync (subscription) failed:', err);
          void resolveHoldedJob(supabaseAdmin, subJobId, 'failed', err instanceof Error ? err.message : String(err));
        });
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
