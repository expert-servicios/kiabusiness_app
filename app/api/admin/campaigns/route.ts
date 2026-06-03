import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';
import { getSegmentRecipients, SEGMENT_LABELS, type SegmentKey } from '@/lib/campaigns/segments';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (p?.role === 'admin' || p?.role === 'owner') ? { admin, userId: user.id } : null;
}

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data, error } = await ctx.admin
    .from('campaigns')
    .select('id,title,status,subject,segment,recipient_count,sent_count,failed_count,sent_at,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [], segmentLabels: SEGMENT_LABELS });
}

const createSchema = z.object({
  title:   z.string().min(1).max(200),
  subject: z.string().min(1).max(300),
  body_html: z.string().min(1),
  body_text: z.string().optional(),
  segment:  z.enum(['all_active','subscribers','no_subscription','leads','all','newsletter']),
});

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  // Pre-count recipients for this segment
  const recipients = await getSegmentRecipients(parsed.data.segment as SegmentKey);

  const { data, error } = await ctx.admin
    .from('campaigns')
    .insert({
      ...parsed.data,
      status: 'draft',
      recipient_count: recipients.length,
      created_by: ctx.userId,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
