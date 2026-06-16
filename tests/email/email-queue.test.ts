/**
 * Unit tests for processEmailQueue()
 *
 * All Supabase and sendEmail calls are mocked — no network or DB access needed.
 * The mock pattern mirrors tests/ai/kia-tools.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
// vi.hoisted() runs before module loading, making the refs available inside
// vi.mock() factories which are also hoisted.

const { mockSendEmail, mockFrom } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockFrom     : vi.fn(),
}));

vi.mock('@/lib/email/send', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

import { processEmailQueue } from '@/lib/email/email-queue';

// ── Types ─────────────────────────────────────────────────────────────────────

type QueueRow = {
  id          : string;
  to_email    : string;
  subject     : string;
  html        : string;
  event_type  : string;
  attempts    : number;
  max_attempts: number;
  scheduled_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a fluent Supabase query-chain mock that is itself awaitable (thenable).
 * All builder methods return the same object so chaining works naturally.
 * When the chain is awaited, it resolves with the provided result.
 */
function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const obj: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'lte', 'in', 'order', 'limit', 'update', 'single']) {
    obj[m] = vi.fn().mockReturnValue(obj);
  }
  // Make it thenable so `await admin.from(...).select(...).eq(...)` resolves.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (obj as any).then = (onFulfilled?: ((v: unknown) => unknown) | null) =>
    Promise.resolve({ data: null, error: null, ...result }).then(onFulfilled ?? undefined);
  return obj;
}

/** Builds a minimal valid QueueRow with optional overrides. */
function makeJob(overrides: Partial<QueueRow> = {}): QueueRow {
  return {
    id          : 'job-1',
    to_email    : 'test@example.com',
    subject     : 'Test Subject',
    html        : '<p>Test</p>',
    event_type  : 'test_event',
    attempts    : 0,
    max_attempts: 3,
    scheduled_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('processEmailQueue', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockSendEmail.mockReset();
  });

  // ── 1. Empty queue ──────────────────────────────────────────────────────────

  it('returns zeroes when SELECT returns no candidates', async () => {
    // call 1: SELECT candidates → empty
    mockFrom.mockReturnValueOnce(makeChain({ data: [], error: null }));

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
    // Only one DB call should have happened (no claim, no update)
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('returns zeroes when SELECT returns null data', async () => {
    // null is treated the same as empty by the !candidates?.length guard
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
  });

  // ── 2. Exhausted jobs ───────────────────────────────────────────────────────

  it('marks exhausted jobs as failed and counts them as skipped', async () => {
    const exhaustedJob = makeJob({ id: 'job-ex', attempts: 3, max_attempts: 3 });

    // call 1: SELECT candidates → 1 exhausted job
    mockFrom.mockReturnValueOnce(makeChain({ data: [exhaustedJob], error: null }));
    // call 2: UPDATE exhausted jobs → status=failed
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 0, failed: 0, skipped: 1 });

    // Verify the UPDATE was called with the correct payload
    const updateChain = mockFrom.mock.results[1]!.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(updateChain['update']).toHaveBeenCalledWith({
      status: 'failed',
      error : 'max_attempts_exceeded',
    });
  });

  it('skips exhausted jobs but still processes eligible ones in the same batch', async () => {
    const exhaustedJob = makeJob({ id: 'job-ex', attempts: 3, max_attempts: 3 });
    const eligibleJob  = makeJob({ id: 'job-ok', attempts: 0, max_attempts: 3 });

    // call 1: SELECT → 1 exhausted + 1 eligible
    mockFrom.mockReturnValueOnce(makeChain({ data: [exhaustedJob, eligibleJob], error: null }));
    // call 2: UPDATE exhausted
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));
    // call 3: CLAIM eligible → returns the claimed job
    mockFrom.mockReturnValueOnce(makeChain({ data: [eligibleJob], error: null }));
    // call 4: UPDATE sent
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    mockSendEmail.mockResolvedValueOnce(undefined);

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 1 });
  });

  // ── 3. Atomic claim — concurrent worker already claimed ─────────────────────

  it('returns 0 processed when claim UPDATE returns empty (race condition)', async () => {
    const job = makeJob();

    // call 1: SELECT → 1 eligible candidate
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 2: CLAIM → empty (another worker already claimed this row)
    mockFrom.mockReturnValueOnce(makeChain({ data: [], error: null }));

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
    // sendEmail must NOT have been called
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('claim UPDATE filters by status=pending to prevent double-processing', async () => {
    const job = makeJob();

    // call 1: SELECT candidates
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 2: CLAIM
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 3: UPDATE sent
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    mockSendEmail.mockResolvedValueOnce(undefined);

    await processEmailQueue();

    // The claim chain (call index 1) must have .eq('status', 'pending')
    const claimChain = mockFrom.mock.results[1]!.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(claimChain['eq']).toHaveBeenCalledWith('status', 'pending');
  });

  // ── 4. Successful send ──────────────────────────────────────────────────────

  it('marks job as sent and increments attempts on successful sendEmail', async () => {
    const job = makeJob({ attempts: 1 });

    // call 1: SELECT
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 2: CLAIM
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 3: UPDATE sent
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    mockSendEmail.mockResolvedValueOnce(undefined);

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });

    // Verify the UPDATE was called with status=sent and attempts=2
    const updateChain = mockFrom.mock.results[2]!.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(updateChain['update']).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent', attempts: 2 }),
    );
    expect(updateChain['eq']).toHaveBeenCalledWith('id', job.id);
  });

  // ── 5. Failed send / retry ─────────────────────────────────────────────────

  it('resets job to pending with incremented attempts when sendEmail throws (retryable)', async () => {
    // attempts=0, max_attempts=3 → nextAttempt=1, isFinal=false → stays pending
    const job = makeJob({ attempts: 0, max_attempts: 3 });

    // call 1: SELECT
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 2: CLAIM
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 3: UPDATE retry
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    mockSendEmail.mockRejectedValueOnce(new Error('SMTP timeout'));

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 0, failed: 1, skipped: 0 });

    const updateChain = mockFrom.mock.results[2]!.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(updateChain['update']).toHaveBeenCalledWith(
      expect.objectContaining({
        status  : 'pending',
        attempts: 1,
        error   : 'SMTP timeout',
      }),
    );
    // scheduled_at should be pushed forward (exponential backoff), not the original value
    const updateArgs = (updateChain['update'] as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
    expect(updateArgs['scheduled_at']).not.toBe(job.scheduled_at);
  });

  // ── 6. Permanent failure ───────────────────────────────────────────────────

  it('marks job as permanently failed when attempts+1 reaches max_attempts', async () => {
    // attempts=2, max_attempts=3 → nextAttempt=3, isFinal=true → status=failed
    const job = makeJob({ attempts: 2, max_attempts: 3 });

    // call 1: SELECT
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 2: CLAIM
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 3: UPDATE permanent failure
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    mockSendEmail.mockRejectedValueOnce(new Error('Permanent SMTP error'));

    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 0, failed: 1, skipped: 0 });

    const updateChain = mockFrom.mock.results[2]!.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(updateChain['update']).toHaveBeenCalledWith(
      expect.objectContaining({
        status  : 'failed',
        attempts: 3,
      }),
    );
    // scheduled_at should be preserved (not pushed forward) on permanent failure
    const updateArgs = (updateChain['update'] as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
    expect(updateArgs['scheduled_at']).toBe(job.scheduled_at);
  });

  // ── 7. Wall-clock guard ────────────────────────────────────────────────────

  it('releases unclaimed jobs back to pending when wall-clock limit is exceeded', async () => {
    const job1 = makeJob({ id: 'job-1' });
    const job2 = makeJob({ id: 'job-2' });

    // Date.now() call sequence:
    //   call 1 → startMs = 0
    //   call 2 → wall-clock check before job1: 0 (0 - 0 = 0, passes)
    //   call 3 → wall-clock check before job2: 60_000 (60_000 - 0 > 50_000, breaks)
    let callCount = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      callCount++;
      if (callCount <= 2) return 0;
      return 60_000;
    });

    // call 1: SELECT → 2 eligible jobs
    mockFrom.mockReturnValueOnce(makeChain({ data: [job1, job2], error: null }));
    // call 2: CLAIM → both claimed
    mockFrom.mockReturnValueOnce(makeChain({ data: [job1, job2], error: null }));
    // call 3: UPDATE sent for job1 (wall-clock check passes on first iteration)
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));
    // call 4: release job2 back to pending
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    mockSendEmail.mockResolvedValueOnce(undefined);

    const result = await processEmailQueue();

    // job1 processed, job2 was not attempted because wall clock expired
    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    // The release UPDATE (call index 3) should reset job2 to pending
    const releaseChain = mockFrom.mock.results[3]!.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(releaseChain['update']).toHaveBeenCalledWith({ status: 'pending' });
    expect(releaseChain['in']).toHaveBeenCalledWith('id', [job2.id]);

    vi.restoreAllMocks();
  });

  it('does not issue a release UPDATE when all claimed jobs are processed within time limit', async () => {
    const job = makeJob();

    // call 1: SELECT
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 2: CLAIM
    mockFrom.mockReturnValueOnce(makeChain({ data: [job], error: null }));
    // call 3: UPDATE sent
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    mockSendEmail.mockResolvedValueOnce(undefined);

    await processEmailQueue();

    // Only 3 mockFrom calls: SELECT, CLAIM, UPDATE-sent — no release call
    expect(mockFrom).toHaveBeenCalledTimes(3);
  });
});
