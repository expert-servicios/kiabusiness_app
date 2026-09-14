# KIA avatar response system — Sprint 5 trusted signals

## Goal

Activate the reserved `confianza` and `alerta_fiscal` states only when KIA has server-authorized evidence that matches the current company scope.

These states remain presentation-only. They do not grant permissions, execute tools, change `KiaDecision`, submit taxes, modify accounting or write financial data.

## `confianza`

Initial trusted source:

- a successful `get_holded_connection_status` tool result with `status=active` for the validated company context.

This produces:

```ts
assurance: {
  kind: 'validated_status',
  source: 'holded'
}
```

Model confidence, natural-language claims and optimistic response wording never produce `confianza`.

## `alerta_fiscal`

Initial authoritative source:

- `fiscal_obligations` rows created from an Admin-confirmed fiscal template;
- query scoped by both authenticated `user_id` and validated `company_id`;
- only `status=pending` rows;
- `template_code` must be present, which is the provenance marker written by the confirmed fiscal-template activation flow; legacy/inferred rows without that marker are ignored;
- only deadlines inside the calendar year range explicitly verified by the application;
- overdue obligation => `critical / filing_overdue`;
- deadline within 7 days => `high / deadline_risk`.

A user phrase such as “IVA”, “sanción” or “plazo fiscal” does **not** create the risk. Message wording is used only as a retrieval gate so KIA does not run a fiscal-calendar lookup during unrelated conversations. Broad non-fiscal phrases such as “plazo de mi expediente” do not open the fiscal lookup. The risk itself must exist in the backend.

The lookup is also enabled while the user is on `/calendario-fiscal` and for accounting/anomaly intents.

When a verified risk exists, KIA appends a short factual notice with model, period and deadline to the reply. This keeps the alert expression aligned with visible content instead of showing a fiscal face next to an unrelated answer.

## Precedence

The existing safety precedence remains unchanged:

1. `requiresManualReview`, `needs_review`, anomaly review -> `aviso`;
2. authoritative fiscal risk -> `alerta_fiscal`;
3. other warnings -> `aviso`;
4. authoritative milestone -> `celebracion`;
5. explicit operational success -> `exito`;
6. authoritative assurance -> `confianza`;
7. clarification -> `duda`;
8. softer contextual states.

## Multi-company isolation

No fiscal or positive signal is emitted without a validated company scope. The fiscal query requires both:

- `user_id = authenticated user`;
- `company_id = active/requested company already validated through profile membership`.

Switching company already resets the KIA session, so the fiscal notice and avatar state cannot reuse history from another entity.

## Fail-closed behavior

No trusted state is emitted when:

- there is no company scope;
- the database lookup fails;
- the obligation is not pending;
- `template_code` is absent;
- the deadline is outside the explicitly verified calendar-year range;
- the Holded status tool fails or returns `missing`;
- the only positive signal is model confidence or user wording.

## QA

Required before merge:

- unit tests for Holded assurance;
- fiscal retrieval gate tests;
- user/company/status/provenance scoping assertions;
- legacy/inferred fiscal row suppression;
- overdue and <=7-day classification;
- future unverified date suppression;
- manual-review precedence;
- factual notice content;
- Typecheck, lint, tests;
- Vercel previews;
- Codex review;
- visual smoke test for `confianza` and `alerta_fiscal`.

No DDL is introduced in Sprint 5.

Refs #190 #171 #176 #178 #188
