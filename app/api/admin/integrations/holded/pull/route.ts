import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import {
  listHoldedContacts, listHoldedInvoices,
  getHoldedRuntimeConfig, HoldedContactFull, HoldedInvoiceSummary,
} from '@/lib/integrations/holded';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

// GET — preview counts available in Holded before pulling
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const cfg = getHoldedRuntimeConfig();
  if (!cfg.configured) {
    return NextResponse.json({ error: 'Holded no configurado (HOLDED_API_KEY)' }, { status: 503 });
  }

  try {
    const [contacts, invoices] = await Promise.all([
      listHoldedContacts({ page: 1 }),
      listHoldedInvoices({ page: 1 }),
    ]);
    return NextResponse.json({
      holded: {
        contacts: contacts.length,
        invoices: invoices.length,
      },
    });
  } catch (err) {
    console.error('[holded pull GET]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST — pull contacts and invoices from Holded into EXPERT
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const cfg = getHoldedRuntimeConfig();
  if (!cfg.configured) {
    return NextResponse.json({ error: 'Holded no configurado (HOLDED_API_KEY)' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as { target?: 'contacts' | 'invoices' | 'all' };
  const target = body.target ?? 'all';

  const result = {
    contacts: { fetched: 0, matched: 0, mapped: 0, errors: 0 },
    invoices: { fetched: 0, matched: 0, errors: 0 },
  };

  // ── Pull contacts → match with EXPERT profiles ────────────────────────────
  if (target === 'contacts' || target === 'all') {
    try {
      const holdedContacts: HoldedContactFull[] = await listHoldedContacts();
      result.contacts.fetched = holdedContacts.length;

      // Build email → holdedId map
      const emailMap = new Map<string, string>();
      for (const c of holdedContacts) {
        if (c.email) emailMap.set(c.email.toLowerCase(), c.id);
      }

      // Fetch all EXPERT profiles with emails
      const authUsers = await listAllAuthUsers();
      const expertEmails = authUsers.map((u) => ({
        id: u.id,
        email: u.email?.toLowerCase() ?? '',
      })).filter((u) => u.email);

      for (const user of expertEmails) {
        const holdedId = emailMap.get(user.email);
        if (!holdedId) continue;
        result.contacts.matched++;

        // Upsert external_mapping
        const { error } = await admin.from('external_mappings').upsert(
          {
            provider: 'holded',
            local_entity: 'profiles',
            local_id: user.id,
            external_entity: 'holded_contact',
            external_id: holdedId,
          },
          { onConflict: 'provider,local_entity,local_id,external_entity' }
        );
        if (!error) result.contacts.mapped++;
        else result.contacts.errors++;
      }
    } catch (err) {
      console.error('[holded pull contacts]', err);
      result.contacts.errors++;
    }
  }

  // ── Pull invoices → match with EXPERT orders ──────────────────────────────
  if (target === 'invoices' || target === 'all') {
    try {
      const holdedInvoices: HoldedInvoiceSummary[] = await listHoldedInvoices();
      result.invoices.fetched = holdedInvoices.length;

      // Fetch existing orders that reference holded invoices (to update status)
      const { data: orders } = await admin
        .from('orders')
        .select('id, holded_invoice_id, status')
        .not('holded_invoice_id', 'is', null);

      const orderByHoldedId = new Map<string, { id: string; status: string }>();
      for (const o of orders ?? []) {
        if (o.holded_invoice_id) orderByHoldedId.set(o.holded_invoice_id, o);
      }

      for (const inv of holdedInvoices) {
        const order = orderByHoldedId.get(inv.id);
        if (!order) continue;
        result.invoices.matched++;

        // status 2 = paid in Holded; update EXPERT order if not already paid
        if (inv.status === 2 && order.status !== 'paid') {
          await admin
            .from('orders')
            .update({ status: 'paid', holded_synced_at: new Date().toISOString() })
            .eq('id', order.id)
            .then(() => null, () => { result.invoices.errors++; });
        }
      }
    } catch (err) {
      console.error('[holded pull invoices]', err);
      result.invoices.errors++;
    }
  }

  // Log the pull event
  await admin.from('integration_sync_events').insert({
    provider: 'holded',
    direction: 'from_external',
    operation: 'pull_sync',
    local_entity: target,
    status: 'success',
    response_payload: result,
    metadata: { triggeredAt: new Date().toISOString() },
  }).then(() => null, () => null);

  return NextResponse.json({ ok: true, result });
}
