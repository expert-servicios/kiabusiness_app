import { NextRequest, NextResponse } from 'next/server';

interface QuoteRequest {
  email: string;
  name: string;
  services: string[];
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequest = await request.json();

    // Validaciones
    if (!body.email || !body.name || !body.services || body.services.length === 0) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // TODO: Implementar
    // 1. Crear presupuesto en Supabase
    // 2. Guardar servicios seleccionados en quote_items
    // 3. Enviar email de confirmación con Resend
    // 4. Crear tarea para admin

    // Respuesta temporal
    return NextResponse.json(
      {
        success: true,
        message: 'Presupuesto creado correctamente',
        quoteId: 'quote_' + Date.now()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // TODO: Obtener presupuestos del usuario autenticado
  return NextResponse.json({ quotes: [] });
}
