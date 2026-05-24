import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import {
  auditKiaDecision,
  auditConversation,
  auditMessage,
  auditHealthRun,
} from '@/lib/ai/kia-auditor/kia-auditor-engine';
import { redactSensitiveText } from '@/lib/ai/kia/kia-redaction';

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    sourceType: 'decision_log' | 'conversation' | 'message' | 'health_check';
    sourceId?: string;
    // For manual message audits
    message?: string;
    kiaResponse?: string;
    channel?: string;
    contactStatus?: 'lead' | 'client' | 'unknown';
    context?: Record<string, unknown>;
  };

  try {
    switch (body.sourceType) {
      case 'decision_log': {
        if (!body.sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 });
        const review = await auditKiaDecision(body.sourceId);
        return NextResponse.json({ ok: true, review });
      }
      case 'conversation': {
        if (!body.sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 });
        const review = await auditConversation(body.sourceId);
        return NextResponse.json({ ok: true, review });
      }
      case 'message': {
        if (!body.message || !body.kiaResponse) {
          return NextResponse.json({ error: 'message and kiaResponse required' }, { status: 400 });
        }
        const review = await auditMessage({
          message:       redactSensitiveText(body.message),
          kiaResponse:   redactSensitiveText(body.kiaResponse),
          channel:       body.channel,
          contactStatus: body.contactStatus,
          context:       body.context,
        });
        return NextResponse.json({ ok: true, review });
      }
      case 'health_check': {
        if (!body.sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 });
        const review = await auditHealthRun(body.sourceId);
        return NextResponse.json({ ok: true, review });
      }
      default:
        return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 });
    }
  } catch (err) {
    console.error('[kia-auditor/review POST]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
