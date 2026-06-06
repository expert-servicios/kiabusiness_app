import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

interface SearchResult {
  id: string;
  type: 'client' | 'case' | 'appointment' | 'quote' | 'document';
  title: string;
  subtitle: string;
  href: string;
}

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (p?.role === 'admin' || p?.role === 'owner') ? admin : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const lq = q.toLowerCase();
  const results: SearchResult[] = [];

  // Run all searches in parallel
  const [profilesRes, authUsersRes, casesRes, appointmentsRes, quotesRes, documentsRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('role', 'client')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(5),

    admin.auth.admin.listUsers({ perPage: 1000 }), // for email fallback

    admin
      .from('cases')
      .select('id, service, category, state, client_id')
      .or(`service.ilike.%${q}%,category.ilike.%${q}%`)
      .neq('state', 'finalizado')
      .limit(5),

    admin
      .from('appointments')
      .select('id, name, email, service, status')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,service.ilike.%${q}%`)
      .limit(4),

    admin
      .from('quotes')
      .select('id, title, amount_eur, status, client_id')
      .ilike('title', `%${q}%`)
      .limit(4),

    admin
      .from('documents')
      .select('id, original_name, state, case_id, client_id')
      .ilike('original_name', `%${q}%`)
      .limit(5),
  ]);

  // Build email map for profiles without email column
  const authEmailById = new Map(
    (authUsersRes.data?.users ?? []).map((u) => [u.id, u.email ?? ''])
  );

  // Clients
  for (const p of profilesRes.data ?? []) {
    const email = p.email ?? authEmailById.get(p.id) ?? '';
    if (!email && !p.full_name) continue;
    results.push({
      id: p.id,
      type: 'client',
      title: p.full_name ?? email,
      subtitle: email,
      href: `/admin/clientes/${p.id}`,
    });
  }

  // Fetch client names for cases/quotes
  const clientIds = [
    ...(casesRes.data ?? []).map((c) => c.client_id),
    ...(quotesRes.data ?? []).map((q) => q.client_id).filter(Boolean),
  ].filter(Boolean) as string[];

  const clientNameMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clientProfiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', clientIds);
    for (const cp of clientProfiles ?? []) {
      const email = authEmailById.get(cp.id) ?? '';
      clientNameMap.set(cp.id, cp.full_name ?? email);
    }
  }

  // Cases
  for (const c of casesRes.data ?? []) {
    const clientName = clientNameMap.get(c.client_id) ?? '';
    results.push({
      id: c.id,
      type: 'case',
      title: c.service,
      subtitle: `${c.state}${clientName ? ` · ${clientName}` : ''}`,
      href: `/admin/expedientes/${c.id}`,
    });
  }

  // Appointments
  for (const a of appointmentsRes.data ?? []) {
    if (!a.name.toLowerCase().includes(lq) && !a.email.toLowerCase().includes(lq) && !a.service.toLowerCase().includes(lq)) continue;
    results.push({
      id: a.id,
      type: 'appointment',
      title: a.name,
      subtitle: `${a.service} · ${a.status}`,
      href: `/admin/citas`,
    });
  }

  // Quotes
  for (const q of quotesRes.data ?? []) {
    const clientName = q.client_id ? clientNameMap.get(q.client_id) ?? '' : '';
    results.push({
      id: q.id,
      type: 'quote',
      title: q.title,
      subtitle: `${q.amount_eur}€ · ${q.status}${clientName ? ` · ${clientName}` : ''}`,
      href: `/admin/presupuestos/${q.id}`,
    });
  }

  // Documents
  for (const d of documentsRes.data ?? []) {
    results.push({
      id: d.id,
      type: 'document',
      title: d.original_name,
      subtitle: `Documento · ${d.state}${d.case_id ? ' · ver expediente' : ''}`,
      href: d.case_id ? `/admin/expedientes/${d.case_id}` : (d.client_id ? `/admin/clientes/${d.client_id}` : '/admin/documentos'),
    });
  }

  return NextResponse.json({ results: results.slice(0, 18) });
}
