import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getFirstAdminProfileId, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { quoteReceivedClient, quoteReceivedAdmin } from '@/lib/email/templates';

const quoteRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  services: z.array(z.string().min(1)).min(1),
  description: z.string().max(1000).optional()
});

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const validated = quoteRequestSchema.parse(requestBody);

    const adminId = await getFirstAdminProfileId();
    if (!adminId) {
      return NextResponse.json(
        { error: 'No se encontró un perfil de administrador para asignar la solicitud' },
        { status: 500 }
      );
    }

    const serviceList = validated.services.join(', ');
    const descriptionText = validated.description?.trim() || 'No se proporcionaron detalles adicionales.';
    const supabaseAdmin = getSupabaseAdmin();

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        name: validated.name,
        email: validated.email,
        phone: null,
        client_type: 'persona_fisica',
        category: 'Presupuesto',
        service: serviceList,
        country: 'ES',
        urgency: 'media',
        message: descriptionText,
        state: 'new'
      })
      .select('id')
      .single();

    if (leadError || !lead?.id) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json({ error: 'Error al registrar la solicitud' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const quoteTitle = `Solicitud de presupuesto de ${validated.name}`;
    const quoteDescription = `Servicios:\n${serviceList}\n\nDetalles:\n${descriptionText}`;

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .insert({
        lead_id: lead.id,
        client_id: null,
        title: quoteTitle,
        description: quoteDescription,
        amount_eur: 0.0,
        status: 'sent',
        stripe_checkout_id: null,
        expires_at: expiresAt,
        created_by: adminId
      })
      .select('id')
      .single();

    if (quoteError || !quote?.id) {
      console.error('Error creating quote:', quoteError);
      return NextResponse.json({ error: 'Error al guardar el presupuesto' }, { status: 500 });
    }

    // Emails: client confirmation + admin notification
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ?? [];

    const clientTpl = quoteReceivedClient(validated.name, serviceList);
    await sendEmail({
      to: validated.email,
      eventType: 'quote.received',
      ...clientTpl,
      metadata: { quote_id: quote.id, lead_id: lead.id }
    });

    if (adminEmails.length) {
      const adminTpl = quoteReceivedAdmin(validated.name, validated.email, serviceList, descriptionText);
      await sendEmail({
        to: adminEmails,
        eventType: 'quote.received.admin',
        ...adminTpl,
        metadata: { quote_id: quote.id, lead_id: lead.id }
      });
    }

    return NextResponse.json(
      { success: true, message: 'Presupuesto creado correctamente', quoteId: quote.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: quotes, error: fetchError } = await supabase
      .from('quotes')
      .select('id,title,description,amount_eur,status,created_at,expires_at,client_id')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching quotes:', fetchError);
      return NextResponse.json({ error: 'Error al obtener presupuestos' }, { status: 500 });
    }

    return NextResponse.json({ quotes: quotes ?? [] });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
