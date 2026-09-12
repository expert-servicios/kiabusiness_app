-- F8: Add token and cost tracking columns to kia_decision_logs.

alter table public.kia_decision_logs
  add column if not exists tokens_in int,
  add column if not exists tokens_out int,
  add column if not exists estimated_cost_usd numeric(10, 6),
  add column if not exists loop_iterations smallint default 0;

comment on column public.kia_decision_logs.tokens_in is
  'Input tokens used by the primary LLM call (sum across agentic loop).';

comment on column public.kia_decision_logs.tokens_out is
  'Output tokens used by the primary LLM call (sum across agentic loop).';

comment on column public.kia_decision_logs.estimated_cost_usd is
  'Estimated USD cost for this decision (input + output tokens times model rate). Approximation only.';

comment on column public.kia_decision_logs.loop_iterations is
  'Number of agentic tool loop iterations executed.';
