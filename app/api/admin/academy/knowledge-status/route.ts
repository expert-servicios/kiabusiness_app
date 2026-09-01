import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { getAcademyKnowledgeArticlesWithStatus, academyKnowledgeStatuses } from '@/lib/utils/academy-knowledge';

export async function GET(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const articles = await getAcademyKnowledgeArticlesWithStatus();
  return NextResponse.json({
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      module: a.module,
      status: a.status,
      updatedAt: a.updatedAt,
    })),
  });
}

const patchSchema = z.object({
  slug: z.string().min(1),
  status: z.enum(academyKnowledgeStatuses),
  admin_note: z.string().max(500).optional().nullable(),
});

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { data: { user } } = await createServerSupabaseClient(request).auth.getUser();

  const { slug, status, admin_note } = parsed.data;
  const { error } = await admin.from('academy_knowledge_status').upsert({
    slug,
    status,
    admin_note: admin_note ?? null,
    validated_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
