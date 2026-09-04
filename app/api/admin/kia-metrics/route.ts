import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  try {
    const [logsResult, feedbackResult, memoriesResult, allLogsCount, allSessionsCount, recentSessionsCount, healthRunsCount] = await Promise.all([
      admin
        .from('kia_decision_logs')
        .select('id, task_type, channel, contact_status, confidence, requires_manual_review, estimated_cost_usd, tokens_in, tokens_out, loop_iterations, model, created_at')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(500),
      admin
        .from('kia_feedback')
        .select('id, rating, intent, task_type, created_at')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(500),
      admin
        .from('kia_memories')
        .select('id', { count: 'exact', head: true }),
      admin
        .from('kia_decision_logs')
        .select('id', { count: 'exact', head: true }),
      admin
        .from('kia_sessions')
        .select('id', { count: 'exact', head: true }),
      admin
        .from('kia_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceIso),
      admin
        .from('kia_health_runs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceIso),
    ]);

    const logs = logsResult.data ?? [];
    const feedback = feedbackResult.data ?? [];
    const memoriesCount = memoriesResult.count ?? 0;
    const allTimeDecisions = allLogsCount.count ?? 0;
    const allTimeSessions = allSessionsCount.count ?? 0;
    const recentSessions = recentSessionsCount.count ?? 0;
    const recentHealthRuns = healthRunsCount.count ?? 0;

    const dailyMap = new Map<string, { decisions: number; cost: number; positiveRatings: number; negativeRatings: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().slice(0, 10), { decisions: 0, cost: 0, positiveRatings: 0, negativeRatings: 0 });
    }
    for (const log of logs) {
      const entry = dailyMap.get(String(log.created_at ?? '').slice(0, 10));
      if (entry) {
        entry.decisions++;
        entry.cost += Number(log.estimated_cost_usd ?? 0);
      }
    }
    for (const fb of feedback) {
      const entry = dailyMap.get(String(fb.created_at ?? '').slice(0, 10));
      if (!entry) continue;
      if (fb.rating === 'positive') entry.positiveRatings++;
      else entry.negativeRatings++;
    }
    const daily = Array.from(dailyMap.entries()).map(([date, value]) => ({
      date,
      ...value,
      cost: Math.round(value.cost * 10000) / 10000,
    }));

    const taskTypeMap = new Map<string, number>();
    for (const log of logs) taskTypeMap.set(log.task_type, (taskTypeMap.get(log.task_type) ?? 0) + 1);
    const taskTypes = Array.from(taskTypeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    const modelMap = new Map<string, number>();
    for (const log of logs) modelMap.set(log.model ?? 'unknown', (modelMap.get(log.model ?? 'unknown') ?? 0) + 1);
    const models = Array.from(modelMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    const totalDecisions = logs.length;
    const totalCost = logs.reduce((sum, log) => sum + Number(log.estimated_cost_usd ?? 0), 0);
    const avgConfidence = totalDecisions > 0 ? logs.reduce((sum, log) => sum + Number(log.confidence ?? 0), 0) / totalDecisions : 0;
    const manualReviewRate = totalDecisions > 0 ? logs.filter((log) => log.requires_manual_review).length / totalDecisions : 0;
    const avgLoopIterations = totalDecisions > 0 ? logs.reduce((sum, log) => sum + Number(log.loop_iterations ?? 0), 0) / totalDecisions : 0;
    const positiveCount = feedback.filter((item) => item.rating === 'positive').length;
    const negativeCount = feedback.filter((item) => item.rating === 'negative').length;
    const satisfactionRate = positiveCount + negativeCount > 0 ? positiveCount / (positiveCount + negativeCount) : null;

    return NextResponse.json({
      summary: {
        totalDecisions,
        allTimeDecisions,
        allTimeSessions,
        recentSessions,
        recentHealthRuns,
        registeredInteractions: totalDecisions + recentSessions,
        totalCostUsd: Math.round(totalCost * 10000) / 10000,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        manualReviewRate: Math.round(manualReviewRate * 100) / 100,
        avgLoopIterations: Math.round(avgLoopIterations * 100) / 100,
        satisfactionRate: satisfactionRate !== null ? Math.round(satisfactionRate * 100) / 100 : null,
        feedbackTotal: positiveCount + negativeCount,
        memoriesTotal: memoriesCount,
        sourceWindowDays: 30,
      },
      daily,
      taskTypes,
      models,
      sourceStatus: {
        decisionLogs: logsResult.error ? 'error' : 'ok',
        feedback: feedbackResult.error ? 'error' : 'ok',
        memories: memoriesResult.error ? 'error' : 'ok',
        sessions: recentSessionsCount.error ? 'error' : 'ok',
        healthRuns: healthRunsCount.error ? 'error' : 'ok',
      },
    });
  } catch (err) {
    console.error('[kia-metrics]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
