import { NextResponse } from 'next/server';

/**
 * Onboarding closure is an operational validation performed by EXPERT after
 * the onboarding meeting. Clients can complete the preparation steps from the
 * dashboard, but cannot set post_purchase_onboarding_at themselves.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'El cierre del alta lo realiza EXPERT después de la reunión de onboarding.',
      code: 'admin_completion_required',
    },
    { status: 403 },
  );
}
