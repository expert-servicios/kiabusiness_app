import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { syncLeadToHolded } from '@/lib/integrations/holded';

const schema = z
  .object({
    leadId: z.string().uuid().optional(),
    saasLeadId: z.string().uuid().optional()
  })
  .refine((data) => Boolean(data.leadId) !== Boolean(data.saasLeadId), {
    message: 'Envia leadId o saasLeadId, pero no ambos'
  });

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 });
    }

    const { leadId, saasLeadId } = parsed.data;

    if (leadId) {
      const { data: lead, error } = await admin
        .from('leads')
        .select('id,name,email,phone,service,category')
        .eq('id', leadId)
        .single();

      if (error || !lead) {
        return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
      }

      const result = await syncLeadToHolded({
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        service: lead.service,
        category: lead.category
      });

      return NextResponse.json({ ok: !result.error, result });
    }

    if (!saasLeadId) {
      return NextResponse.json({ error: 'Lead SaaS no encontrado' }, { status: 404 });
    }

    const { data: saasLead, error } = await admin
      .from('saas_leads')
      .select('id,name,email,phone,company_name,client_count_range,operational_problem,pilot_interest')
      .eq('id', saasLeadId)
      .single();

    if (error || !saasLead) {
      return NextResponse.json({ error: 'Lead SaaS no encontrado' }, { status: 404 });
    }

    const result = await syncLeadToHolded({
      leadId: saasLead.id,
      name: saasLead.name,
      email: saasLead.email,
      phone: saasLead.phone,
      service: `Piloto SaaS - ${saasLead.company_name}`,
      category: 'SaaS para asesorías',
      localEntity: 'saas_leads'
    });

    return NextResponse.json({ ok: !result.error, result });
  } catch (error) {
    console.error('[admin/integrations/holded/sync-lead] error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
