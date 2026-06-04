import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const since = new Date();
  since.setDate(since.getDate() - 30); // last 30 days
  const sinceIso = since.toISOString();

  try {
    const [logsResult, feedbackResult, memoriesResult] = await Promise.all([
      // Decision logs: last 30 days with cost/token data
      admin
        .from('kia_decision_logs')
        .select('id, task_type, channel, contact_status, confidence, requires_manual_review, estimated_cost_usd, tokens_in, tokens_out, loop_iterations, model, created_at')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(500),

      // Feedback: last 30 days
      admin
        .from('kia_feedback')
        .select('id, rating, intent, task_type, created_at')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(500),

      // Memories count
      admin
        .from('kia_memories')
        .select('id, memory_type, created_at', { count: 'exact', head: false })
        .gte('created_at', sinceIso)
        .limit(1),
    ]);

    const logs = logsResult.data ?? [];
    const feedback = feedbackResult.data ?? [];
    const memoriesCount = memoriesResult.count ?? 0;

    // Aggregate by day (last 14 days)
    const dailyMap = new Map<string, { decisions: number; cost: number; positiveRatings: number; negativeRatings: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { decisions: 0, cost: 0, positiveRatings: 0, negativeRatings: 0 });
    }
    for (const log of logs) {
      const day = String(log.created_at ?? '').slice(0, 10);
      const entry = dailyMap.get(day);
      if (entry) { entry.decisions++; entry.cost += Number(log.estimated_cost_usd ?? 0); }
    }
    for (const fb of feedback) {
      const day = String(fb.created_at ?? '').slice(0, 10);
      const entry = dailyMap.get(day);
      if (entry) {
        if (fb.rating === 'positive') entry.positiveRatings++;
        else entry.negativeRatings++;
      }
    }
    const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v, cost: Math.round(v.cost * 10000) / 10000 }));

    // Task type distribution
    const taskTypeMap = new Map<string, number>();
    for (const log of logs) { taskTypeMap.set(log.task_type, (taskTypeMap.get(log.task_type) ?? 0) + 1); }
    const taskTypes = Array.from(taskTypeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Model distribution
    const modelMap = new Map<string, number>();
    for (const log of logs) { modelMap.set(log.model ?? 'unknown', (modelMap.get(log.model ?? 'unknown') ?? 0) + 1); }
    const models = Array.from(modelMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Summary stats
    const totalDecisions = logs.length;
    const totalCost = logs.reduce((s, l) => s + Number(l.estimated_cost_usd ?? 0), 0);
    const avgConfidence = totalDecisions > 0 ? logs.reduce((s, l) => s + Number(l.confidence ?? 0), 0) / totalDecisions : 0;
    const manualReviewRate = totalDecisions > 0 ? logs.filter((l) => l.requires_manual_review).length / totalDecisions : 0;
    const avgLoopIterations = totalDecisions > 0 ? logs.reduce((s, l) => s + Number(l.loop_iterations ?? 0), 0) / totalDecisions : 0;
    const positiveCount = feedback.filter((f) => f.rating === 'positive').length;
    const negativeCount = feedback.filter((f) => f.rating === 'negative').length;
    const satisfactionRate = (positiveCount + negativeCount) > 0 ? positiveCount / (positiveCount + negativeCount) : null;

    return NextResponse.json({
      summary: {
        totalDecisions,
        totalCostUsd: Math.round(totalCost * 10000) / 10000,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        manualReviewRate: Math.round(manualReviewRate * 100) / 100,
        avgLoopIterations: Math.round(avgLoopIterations * 100) / 100,
        satisfactionRate: satisfactionRate !== null ? Math.round(satisfactionRate * 100) / 100 : null,
        feedbackTotal: positiveCount + negativeCount,
        memoriesTotal: memoriesCount,
      },
      daily,
      taskTypes,
      models,
    });
  } catch (err) {
    console.error('[kia-metrics]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
