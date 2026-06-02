/**
 * scripts/stripe-import.mjs
 *
 * One-time import of existing Stripe data into EXPERT.
 * Imports: customers → profiles/leads, paid invoices → orders, subscriptions
 *
 * Usage:
 *   node scripts/stripe-import.mjs            # dry run (no writes)
 *   node scripts/stripe-import.mjs --apply    # write to Supabase
 *   node scripts/stripe-import.mjs --apply --limit=50  # test with 50 customers
 */

import 'dotenv/config';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = !process.argv.includes('--apply');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const CUSTOMER_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Stats ────────────────────────────────────────────────────────────────────

const stats = {
  customers : { total: 0, linked: 0, lead_created: 0, skipped: 0, error: 0 },
  invoices  : { total: 0, created: 0, skipped: 0, error: 0 },
  subs      : { total: 0, created: 0, updated: 0, skipped: 0, error: 0 },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(symbol, ...args) {
  console.log(symbol, ...args);
}

/** Resolve EXPERT profile ID for a Stripe customer. Priority:
 *  1. customer.metadata.user_id
 *  2. auth user with matching email → profile
 *  Returns null if no match found. */
async function resolveProfileId(customer) {
  // 1. Explicit metadata link
  if (customer.metadata?.user_id) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', customer.metadata.user_id)
      .maybeSingle();
    if (data) return data.id;
  }

  // 2. Email match via auth
  if (customer.email) {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authUser = authData?.users?.find(
      (u) => u.email?.toLowerCase() === customer.email.toLowerCase()
    );
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();
      if (profile) return profile.id;
    }
  }

  return null;
}

/** Map Stripe subscription status to our allowed values */
function mapSubStatus(status) {
  const allowed = ['active', 'canceled', 'past_due', 'unpaid', 'trialing'];
  return allowed.includes(status) ? status : 'active';
}

/** Derive plan name from price ID or metadata */
function derivePlanName(sub) {
  if (sub.metadata?.plan_name) return sub.metadata.plan_name;
  const priceMap = {
    [process.env.STRIPE_PLAN_MONTHLY_49  ?? '___']: 'Plan Supervisión',
    [process.env.STRIPE_PLAN_MONTHLY_99  ?? '___']: 'Plan Avanzado',
    [process.env.STRIPE_PLAN_MONTHLY_199 ?? '___']: 'Plan Colaborativo',
  };
  const priceId = sub.items.data[0]?.price.id ?? '';
  return priceMap[priceId] ?? sub.items.data[0]?.price.nickname ?? 'Suscripción EXPERT';
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  EXPERT ← Stripe import');
console.log(DRY_RUN ? '  MODE: DRY RUN (no writes)' : '  MODE: APPLY (writing to Supabase)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── Cache all auth users once ─────────────────────────────────────────────
const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const emailToProfileId = new Map();
if (authData?.users) {
  const ids = authData.users.map((u) => u.id);
  const { data: profiles } = await supabase.from('profiles').select('id').in('id', ids);
  const profileIds = new Set((profiles ?? []).map((p) => p.id));
  for (const u of authData.users) {
    if (u.email && profileIds.has(u.id)) {
      emailToProfileId.set(u.email.toLowerCase(), u.id);
    }
  }
}

// ── Iterate customers ─────────────────────────────────────────────────────
let processed = 0;

for await (const customer of stripe.customers.list({ limit: 100, expand: ['data.subscriptions'] })) {
  if (processed >= CUSTOMER_LIMIT) break;
  processed++;
  stats.customers.total++;

  // ── Resolve or create profile/lead ────────────────────────────────────
  let profileId = null;

  // 1. metadata.user_id
  if (customer.metadata?.user_id) {
    const { data } = await supabase.from('profiles').select('id').eq('id', customer.metadata.user_id).maybeSingle();
    if (data) profileId = data.id;
  }

  // 2. email match
  if (!profileId && customer.email) {
    profileId = emailToProfileId.get(customer.email.toLowerCase()) ?? null;
  }

  if (profileId) {
    // Link stripe_customer_id to existing profile
    log('🔗', `${customer.email ?? customer.id} → profile ${profileId}`);
    stats.customers.linked++;
    if (!DRY_RUN) {
      await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', profileId);
    }
  } else if (customer.email) {
    // No match → create/upsert lead
    log('👤', `No match for ${customer.email} — creating lead`);
    stats.customers.lead_created++;
    if (!DRY_RUN) {
      await supabase.from('leads').upsert(
        {
          phone  : customer.phone ?? null,
          name   : customer.name ?? customer.email.split('@')[0],
          email  : customer.email,
          source : 'stripe_import',
          notes  : `Importado desde Stripe customer ${customer.id}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
    }
  } else {
    log('⚠️', `Skipping customer ${customer.id} — no email`);
    stats.customers.skipped++;
  }

  // ── Paid invoices → orders ────────────────────────────────────────────
  for await (const invoice of stripe.invoices.list({ customer: customer.id, limit: 100, status: 'paid' })) {
    stats.invoices.total++;
    const paymentId = typeof invoice.payment_intent === 'string'
      ? invoice.payment_intent
      : (invoice.payment_intent?.id ?? invoice.id);

    // Idempotency check
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_id', paymentId)
      .maybeSingle();

    if (existing) {
      stats.invoices.skipped++;
      continue;
    }

    const amountEur = (invoice.amount_paid ?? 0) / 100;
    const description =
      invoice.lines.data[0]?.description ??
      invoice.description ??
      'Factura Stripe importada';

    log('🧾', `  Invoice ${invoice.id} — €${amountEur.toFixed(2)} — ${description}`);
    stats.invoices.created++;

    if (!DRY_RUN) {
      await supabase.from('orders').insert({
        client_id       : profileId ?? null,
        stripe_payment_id: paymentId,
        amount_eur      : amountEur,
        currency        : (invoice.currency ?? 'eur').toUpperCase(),
        status          : 'paid',
        source          : 'stripe_import',
        metadata        : {
          stripe_invoice_id: invoice.id,
          stripe_customer_id: customer.id,
          description,
          imported_at: new Date().toISOString(),
        },
      });
    }
  }

  // ── Subscriptions ─────────────────────────────────────────────────────
  for await (const sub of stripe.subscriptions.list({ customer: customer.id, limit: 100 })) {
    stats.subs.total++;
    const priceId  = sub.items.data[0]?.price.id ?? '';
    const status   = mapSubStatus(sub.status);
    const planName = derivePlanName(sub);
    const periodEnd = sub.items.data[0]?.current_period_end
      ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
      : null;
    const periodStart = sub.items.data[0]?.current_period_start
      ? new Date(sub.items.data[0].current_period_start * 1000).toISOString()
      : null;

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle();

    if (existingSub) {
      log('♻️', `  Sub ${sub.id} already exists — updating status`);
      stats.subs.updated++;
      if (!DRY_RUN) {
        await supabase.from('subscriptions').update({
          status,
          current_period_start: periodStart,
          current_period_end  : periodEnd,
          updated_at          : new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id);
      }
    } else {
      log('📋', `  Sub ${sub.id} — ${planName} — ${status}`);
      stats.subs.created++;
      if (!DRY_RUN) {
        await supabase.from('subscriptions').upsert(
          {
            client_id           : profileId ?? null,
            stripe_subscription_id: sub.id,
            stripe_customer_id  : customer.id,
            stripe_price_id     : priceId,
            plan_name           : planName,
            status,
            current_period_start: periodStart,
            current_period_end  : periodEnd,
            updated_at          : new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' }
        );
      }
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  RESUMEN');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Clientes procesados : ${stats.customers.total}`);
console.log(`  Vinculados a perfil: ${stats.customers.linked}`);
console.log(`  Leads creados      : ${stats.customers.lead_created}`);
console.log(`  Omitidos (sin email): ${stats.customers.skipped}`);
console.log(`Facturas pagadas`);
console.log(`  Órdenes creadas    : ${stats.invoices.created}`);
console.log(`  Ya existían        : ${stats.invoices.skipped}`);
console.log(`Suscripciones`);
console.log(`  Creadas            : ${stats.subs.created}`);
console.log(`  Actualizadas       : ${stats.subs.updated}`);
console.log(`  Ya existían        : ${stats.subs.skipped}`);

if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN — ningún cambio escrito.');
  console.log('   Ejecuta con --apply para aplicar los cambios.\n');
} else {
  console.log('\n✅ Importación completada.\n');
}
