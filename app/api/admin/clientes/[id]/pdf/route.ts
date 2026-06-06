// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * GET /api/admin/clientes/[id]/pdf
 * Admin-only: streams a client dossier PDF.
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// ── Styles ─────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page        : { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#3d3528', backgroundColor: '#ffffff' },
  brand       : { fontSize: 7, color: '#c88b25', fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  title       : { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#07111d', marginBottom: 3 },
  subtitle    : { fontSize: 9, color: '#7a6e5f', marginBottom: 20 },
  section     : { marginTop: 18 },
  sectionTitle: { fontSize: 8, color: '#c88b25', fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7, borderBottom: '0.5 solid #e8dfc8', paddingBottom: 3 },
  row         : { flexDirection: 'row', paddingVertical: 3.5, borderBottom: '0.5 solid #f0e8d8' },
  th          : { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#07111d' },
  td          : { fontSize: 8, color: '#3d3528' },
  tdGray      : { fontSize: 8, color: '#7a6e5f' },
  badge       : { fontSize: 7, color: '#c88b25', fontFamily: 'Helvetica-Bold' },
  infoGrid    : { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  infoCell    : { width: '48%', backgroundColor: '#faf9f6', border: '0.5 solid #e8dfc8', borderRadius: 4, padding: 7, marginBottom: 4 },
  infoLabel   : { fontSize: 7, color: '#7a6e5f', marginBottom: 2 },
  infoValue   : { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#07111d' },
  footer      : { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 7, color: '#a89880', textAlign: 'center', borderTop: '0.5 solid #e8dfc8', paddingTop: 5 },
  pill        : { fontSize: 7, color: '#1fae4b', fontFamily: 'Helvetica-Bold' },
  pillWarn    : { fontSize: 7, color: '#c88b25', fontFamily: 'Helvetica-Bold' },
  pillGray    : { fontSize: 7, color: '#7a6e5f', fontFamily: 'Helvetica-Bold' },
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface DossierData {
  generatedAt  : string;
  client: {
    id           : string;
    full_name    : string;
    email        : string;
    phone        : string | null;
    tax_id       : string | null;
    address      : string | null;
    city         : string | null;
    province     : string | null;
    postal_code  : string | null;
    status       : string;
    created_at   : string;
  };
  cases: { id: string; service: string; state: string; opened_at: string }[];
  subs: { id: string; plan: string; status: string; current_period_end: string | null }[];
  orders: { id: string; amount_eur: number; status: string; created_at: string; source: string | null }[];
  quotes: { id: string; title: string; amount_eur: number; status: string; created_at: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtEur(n: number) {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
}

function stateLabel(s: string) {
  const m: Record<string, string> = {
    pendiente_documentacion: 'Pendiente docs', en_revision: 'En revisión',
    en_proceso: 'En proceso', presentado: 'Presentado', finalizado: 'Finalizado', cerrado: 'Cerrado',
  };
  return m[s] ?? s;
}

function subStatusStyle(s: string) {
  if (s === 'active') return S.pill;
  if (s === 'past_due') return S.pillWarn;
  return S.pillGray;
}

// ── PDF Component ──────────────────────────────────────────────────────────────

function ClientPDF({ d }: { d: DossierData }) {
  const c = d.client;
  const address = [c.address, c.city, c.province, c.postal_code].filter(Boolean).join(', ');
  const activeCases = d.cases.filter((x) => x.state !== 'cerrado' && x.state !== 'finalizado');
  const totalPaid   = d.orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amount_eur, 0);

  return React.createElement(
    Document,
    { title: `Dossier cliente — ${c.full_name}` },
    React.createElement(
      Page,
      { size: 'A4', style: S.page },

      // Header
      React.createElement(Text, { style: S.brand }, 'EXPERT Consulting · Dossier de cliente'),
      React.createElement(Text, { style: S.title }, c.full_name || c.email),
      React.createElement(Text, { style: S.subtitle },
        `Generado: ${fmtDate(d.generatedAt)}  ·  Alta: ${fmtDate(c.created_at)}  ·  Estado: ${c.status === 'active' ? 'Activo' : 'Inactivo'}`
      ),

      // Contact info
      React.createElement(View, { style: S.section },
        React.createElement(Text, { style: S.sectionTitle }, 'Datos de contacto'),
        React.createElement(View, { style: S.infoGrid },
          ...[
            { label: 'Email', value: c.email },
            { label: 'Teléfono', value: c.phone ?? '—' },
            { label: 'NIF/CIF', value: c.tax_id ?? '—' },
            { label: 'Dirección', value: address || '—' },
          ].map(({ label, value }) =>
            React.createElement(View, { key: label, style: S.infoCell },
              React.createElement(Text, { style: S.infoLabel }, label),
              React.createElement(Text, { style: S.infoValue }, value),
            )
          ),
        ),
      ),

      // Suscripciones
      d.subs.length > 0
        ? React.createElement(View, { style: S.section },
          React.createElement(Text, { style: S.sectionTitle }, `Suscripciones (${d.subs.length})`),
          React.createElement(View, { style: { ...S.row, borderBottom: '1 solid #d8cbb5' } },
            React.createElement(Text, { style: { ...S.th, flex: 3 } }, 'Plan'),
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Estado'),
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Renovación'),
          ),
          ...d.subs.map((sub) =>
            React.createElement(View, { key: sub.id, style: S.row },
              React.createElement(Text, { style: { ...S.td, flex: 3 } }, sub.plan),
              React.createElement(Text, { style: { ...subStatusStyle(sub.status), flex: 2 } }, sub.status),
              React.createElement(Text, { style: { ...S.tdGray, flex: 2 } }, fmtDate(sub.current_period_end)),
            )
          ),
        )
        : React.createElement(View, { style: S.section },
          React.createElement(Text, { style: S.sectionTitle }, 'Suscripciones'),
          React.createElement(Text, { style: { ...S.tdGray, marginTop: 4 } }, 'Sin suscripciones activas.'),
        ),

      // Expedientes
      d.cases.length > 0
        ? React.createElement(View, { style: S.section },
          React.createElement(Text, { style: S.sectionTitle }, `Expedientes (${d.cases.length} total · ${activeCases.length} activos)`),
          React.createElement(View, { style: { ...S.row, borderBottom: '1 solid #d8cbb5' } },
            React.createElement(Text, { style: { ...S.th, flex: 4 } }, 'Servicio'),
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Estado'),
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Apertura'),
          ),
          ...d.cases.slice(0, 12).map((cas) =>
            React.createElement(View, { key: cas.id, style: S.row },
              React.createElement(Text, { style: { ...S.td, flex: 4 } }, cas.service),
              React.createElement(Text, { style: { ...S.tdGray, flex: 2 } }, stateLabel(cas.state)),
              React.createElement(Text, { style: { ...S.tdGray, flex: 2 } }, fmtDate(cas.opened_at)),
            )
          ),
        )
        : React.createElement(View, { style: S.section },
          React.createElement(Text, { style: S.sectionTitle }, 'Expedientes'),
          React.createElement(Text, { style: { ...S.tdGray, marginTop: 4 } }, 'Sin expedientes.'),
        ),

      // Pagos
      d.orders.length > 0
        ? React.createElement(View, { style: S.section },
          React.createElement(Text, { style: S.sectionTitle }, `Pagos (${d.orders.length} · total cobrado: ${fmtEur(totalPaid)})`),
          React.createElement(View, { style: { ...S.row, borderBottom: '1 solid #d8cbb5' } },
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Fecha'),
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Origen'),
            React.createElement(Text, { style: { ...S.th, flex: 1.5, textAlign: 'right' } }, 'Importe'),
            React.createElement(Text, { style: { ...S.th, flex: 1.5 } }, 'Estado'),
          ),
          ...d.orders.slice(0, 15).map((ord) =>
            React.createElement(View, { key: ord.id, style: S.row },
              React.createElement(Text, { style: { ...S.tdGray, flex: 2 } }, fmtDate(ord.created_at)),
              React.createElement(Text, { style: { ...S.tdGray, flex: 2 } }, ord.source ?? 'stripe'),
              React.createElement(Text, { style: { ...S.td, flex: 1.5, textAlign: 'right' } }, fmtEur(ord.amount_eur)),
              React.createElement(Text, { style: { ...S.tdGray, flex: 1.5 } }, ord.status),
            )
          ),
        )
        : null,

      // Presupuestos
      d.quotes.length > 0
        ? React.createElement(View, { style: S.section },
          React.createElement(Text, { style: S.sectionTitle }, `Presupuestos (${d.quotes.length})`),
          React.createElement(View, { style: { ...S.row, borderBottom: '1 solid #d8cbb5' } },
            React.createElement(Text, { style: { ...S.th, flex: 4 } }, 'Servicio'),
            React.createElement(Text, { style: { ...S.th, flex: 1.5, textAlign: 'right' } }, 'Importe'),
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Estado'),
            React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Fecha'),
          ),
          ...d.quotes.slice(0, 10).map((q) =>
            React.createElement(View, { key: q.id, style: S.row },
              React.createElement(Text, { style: { ...S.td, flex: 4 } }, q.title),
              React.createElement(Text, { style: { ...S.td, flex: 1.5, textAlign: 'right' } }, fmtEur(q.amount_eur)),
              React.createElement(Text, { style: { ...S.tdGray, flex: 2 } }, q.status),
              React.createElement(Text, { style: { ...S.tdGray, flex: 2 } }, fmtDate(q.created_at)),
            )
          ),
        )
        : null,

      // Footer
      React.createElement(View, { style: S.footer, fixed: true },
        React.createElement(Text, null,
          `EXPERT Consulting · Dossier confidencial · ${fmtDate(d.generatedAt)}`
        ),
      ),
    )
  );
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (prof?.role !== 'admin' && prof?.role !== 'owner') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  // Fetch all client data in parallel
  const [profileRes, casesRes, subsRes, ordersRes, quotesRes] = await Promise.all([
    admin.from('profiles').select('id,full_name,email,phone,tax_id,address,city,province,postal_code,status,created_at').eq('id', id).single(),
    admin.from('cases').select('id,service,state,opened_at').eq('client_id', id).order('opened_at', { ascending: false }).limit(20),
    admin.from('subscriptions').select('id,plan,status,current_period_end').eq('client_id', id).order('created_at', { ascending: false }),
    admin.from('orders').select('id,amount_eur,status,created_at,source').eq('client_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('quotes').select('id,title,amount_eur,status,created_at').eq('client_id', id).order('created_at', { ascending: false }).limit(15),
  ]);

  if (!profileRes.data) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const dossier: DossierData = {
    generatedAt : new Date().toISOString(),
    client      : profileRes.data,
    cases       : casesRes.data ?? [],
    subs        : subsRes.data ?? [],
    orders      : ordersRes.data ?? [],
    quotes      : quotesRes.data ?? [],
  };

  const name    = dossier.client.full_name || dossier.client.email;
  const slug    = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
  const buffer  = await renderToBuffer(React.createElement(ClientPDF, { d: dossier }));

  return new NextResponse(buffer, {
    headers: {
      'Content-Type'       : 'application/pdf',
      'Content-Disposition': `attachment; filename="dossier-${slug}.pdf"`,
    },
  });
}
