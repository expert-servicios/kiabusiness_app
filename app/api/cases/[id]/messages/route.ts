import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const messageSchema = z.object({ body: z.string().min(1).max(2000) });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id,body,sender_role,created_at,sender_id,profiles(full_name)')
      .eq('case_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Messages GET error:', error);
      return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = sessionData.session.user.id;
    const adminSupabase = getSupabaseAdmin();

    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', userId).single();
    const senderRole = profile?.role === 'admin' ? 'admin' : 'client';

    // Verify access
    const { data: caseData } = await adminSupabase
      .from('cases')
      .select('id,client_id')
      .eq('id', caseId)
      .single();

    if (!caseData) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    if (senderRole === 'client' && caseData.client_id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = messageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }

    const { data: message, error: insertError } = await adminSupabase
      .from('messages')
      .insert({ case_id: caseId, sender_id: userId, sender_role: senderRole, body: parseResult.data.body })
      .select('id,body,sender_role,created_at,sender_id')
      .single();

    if (insertError || !message) {
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Message POST error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
