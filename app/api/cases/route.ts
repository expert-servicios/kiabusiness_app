import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: cases, error: fetchError } = await supabase
      .from('cases')
      .select('id,category,service,state,opened_at,closed_at,quote_id,docs_checklist')
      .order('opened_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching cases:', fetchError);
      return NextResponse.json({ error: 'Error al obtener expedientes' }, { status: 500 });
    }

    return NextResponse.json({ cases: cases ?? [] });
  } catch (error) {
    console.error('Cases GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
