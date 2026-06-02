# EXPERT End-to-End Security Audit

Date: 2026-06-02  
Scope: Next.js app, API routes, Supabase access patterns, RLS migrations, WABA/Kia, Holded MCP bridge, Stripe/Resend webhooks, public forms, admin/dashboard surfaces, dependency audit, and cloud-copy readiness.

## Executive Summary

The project has a solid security baseline in several critical areas:

- `.env*` files are ignored; no real secrets were found in tracked files by the quick secret scan.
- Stripe, Resend, WhatsApp and cron endpoints use signature/secret checks.
- Sensitive Holded API keys were moved into `client_integration_secrets`, with RLS enabled and authenticated/anon grants revoked.
- WABA webhook verifies Meta signatures when `META_APP_SECRET` is configured.
- Checkout routes require login, profile and billing readiness, and monthly plans require active Holded.
- Security headers exist for frame busting, MIME sniffing, referrer policy, HSTS and permissions policy.

However, the audit found several high-impact vulnerabilities and hardening gaps. Three critical issues were patched immediately in this pass.

## Fixed During This Audit

### 1. Admin media retry endpoint had no admin authorization

File: `app/api/admin/whatsapp/retry-media/route.ts`

Issue: the route used `service_role` and accepted `conversationId` without checking session or admin role.

Impact: an unauthenticated actor who guessed or obtained a conversation ID could trigger WhatsApp media download/re-storage and receive the stored URL.

Fix applied:

- Added `requireAdminClient(request)`.
- Returns `403` before touching Supabase or Meta media if not admin/owner.

Validation: targeted ESLint passed.

### 2. Internal Kia report generator failed open when secret was missing

File: `app/api/kia/report/generate/route.ts`

Issue: `verifyInternalSecret()` returned `true` when `INTERNAL_API_SECRET` was not configured.

Impact: if the env var was missing in production, the endpoint became public and could generate AI reports and trigger WhatsApp notifications to arbitrary phone numbers.

Fix applied:

- Missing `INTERNAL_API_SECRET` now logs and fails closed.
- Added `INTERNAL_API_SECRET=` to `.env.example`.

Validation: targeted ESLint passed.

### 3. Report generation accepted cross-client `clientId` without admin check

File: `app/api/reports/generate/route.ts`

Issue: authenticated users could pass `clientId` as an "admin override"; the handler did not verify admin role before using another client's ID.

Impact: IDOR risk. A user with a known UUID could attempt to generate reports against another client's Holded integration and create/report sensitive financial summaries.

Fix applied:

- If `clientId` is present and differs from the authenticated user, require actor profile role `admin`.
- Normal user self-generation remains unchanged.

Validation: targeted ESLint passed.

## Critical Findings Not Yet Fixed

### 4. OAuth callbacks lack robust `state` nonce and callback-side role validation

Files:

- `app/api/auth/google-gmail/callback/route.ts`
- `app/api/auth/ms365/callback/route.ts`
- `app/api/auth/google-calendar/callback/route.ts`
- `app/api/auth/google-gmail/route.ts`
- `app/api/auth/ms365/route.ts`
- `app/api/auth/google-calendar/route.ts`

Issues:

- Gmail callback stores global admin tokens without checking a callback-bound admin session/state.
- MS365 callback checks that a user is logged in, but does not re-check admin role before storing global admin tokens.
- Google Calendar uses `state=<userId>` without a nonce and callback does not verify the current Supabase session.

Impact:

- Admin mailbox/calendar integrations can be overwritten or connected to the wrong identity.
- CSRF/login confusion risk in OAuth flows.
- Tokens are saved with `service_role`, so callback correctness is the main boundary.

Recommended fix:

- Create OAuth state table or signed encrypted state cookie.
- Store `nonce`, `provider`, `user_id`, `role_required`, `expires_at`.
- Validate state and current Supabase session in every callback.
- For global Gmail/MS365 tokens, require callback actor role `admin`.
- Reject reused/expired state.

### 5. Holded MCP bridge session cookie is readable by JavaScript

File: `app/api/auth/holded-claude/route.ts`

Issue: `__session` cookie is set with `httpOnly: false`.

Impact: any XSS on the parent domain, or a compromised same-site subdomain depending on cookie domain, can read the bridge token.

Recommended fix:

- Set `httpOnly: true`. The MCP server still receives the cookie in the HTTP Cookie header; JavaScript access is not needed for server-side validation.
- Keep `secure: true`.
- Reassess `sameSite: 'none'` and parent domain scope after DNS is final.

### 6. Holded Claude login bridge uses `redirectTo`, but login page only honors `next`

Files:

- `app/auth/holded-claude/page.tsx`
- `app/api/auth/holded-claude/route.ts`
- `app/auth/login/page.tsx`
- `app/auth/callback/route.ts`

Issue: bridge routes set `/auth/login?redirectTo=...`, but the login UI reads only `next`.

Impact:

- Broken connector login continuity.
- Users may land in dashboard instead of returning to the MCP flow, causing repeated login/consent attempts.

Recommended fix:

- Standardize on `next`.
- If full external bridge URLs are needed, use a server-side nonce table instead of passing full redirect URLs through the public login query.

## High Findings

### 7. Public viability route can trigger AI and email without visible rate/recaptcha guard

File: `app/api/services/viabilidad/route.ts`

Issue: public POST calls AI, stores a record with `service_role`, and sends email. Unlike other lead forms, it does not use `checkRateLimit`, `checkSpam` or reCAPTCHA.

Impact:

- AI cost abuse.
- Email spam/backscatter.
- DB pollution.

Recommended fix:

- Add same anti-spam layer as `contact`, `holded-demo`, `presupuesto-avanzado` and `saas-leads`.
- Cap answers/docStatus size more tightly.
- Log source IP/user-agent metadata for abuse triage.

### 8. Inactive profiles are not blocked consistently

Files:

- `proxy.ts`
- `app/(protected)/dashboard/layout.tsx`
- `app/(protected)/admin/layout.tsx`
- API auth helpers/routes using `auth.getUser()`

Issue: `profiles.status` exists and admin can mark users inactive, but layouts and route helpers generally only check `user` and sometimes `role`.

Impact:

- A deactivated user with a valid Supabase session may keep using dashboard/API until session expires or auth user is disabled.

Recommended fix:

- Add `requireActiveUser()` helper.
- Enforce `status='active'` in protected layouts and sensitive API routes.
- On admin deactivation, optionally revoke Supabase sessions.

### 9. File uploads allow broad content types and no malware scanning

File: `app/api/cases/[id]/documents/route.ts`

Issue: uploads validate size only. MIME/extension allowlist and malware scanning are not present.

Impact:

- Private bucket reduces exposure, but malicious files can be stored and later opened by admins/clients.

Recommended fix:

- Allowlist document MIME types and extensions.
- Store normalized metadata.
- Add asynchronous antivirus scanning before marking file usable.
- Consider blocking active content formats unless needed.

### 10. `xlsx` dependency has high vulnerabilities

Dependency: `xlsx`

Audit result:

- High: prototype pollution in SheetJS.
- High: ReDoS in SheetJS.
- No npm audit fix available.

Usage seen:

- `app/api/reports/[id]/excel/route.ts` writes generated workbooks.
- `lib/documents/document-classifier.ts` detects spreadsheet filenames but does not parse content in the reviewed code.

Recommended fix:

- If only writing reports, replace `xlsx` with a maintained writer such as `exceljs`.
- If future parsing is added, treat spreadsheet uploads as untrusted and isolate parsing.

## Medium Findings

### 11. CSP is missing

File: `next.config.ts`

Current headers include HSTS, X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy, but no Content-Security-Policy.

Recommended fix:

- Add report-only CSP first.
- Cover scripts, images, connect-src for Supabase, Stripe, Meta, Resend, Google/Microsoft OAuth, Vercel analytics if used.
- Move to enforcing CSP after one observation cycle.

### 12. Admin/owner authorization model is inconsistent

Files:

- `lib/auth/require-admin.ts`
- `app/(protected)/admin/layout.tsx`
- many `/api/admin/*` routes
- Supabase `public.is_admin()`

Issue:

- Some server code accepts `owner`.
- Most API routes and RLS policies accept only `admin`.

Impact:

- Mostly an operations/permission bug, but inconsistent admin surface can create accidental bypasses or confusing denials.

Recommended fix:

- Define canonical roles: `owner`, `admin`, `collaborator`, `client`.
- Add helpers: `requireOwner`, `requireAdminOrOwner`, `requireStaff`.
- Update DB function or avoid `owner` if not intended.

### 13. `.claude/settings.json` is tracked and contains operational command history

File: `.claude/settings.json`

Issue: tracked settings include allowed shell operations such as git push and Vercel env removal commands.

Impact:

- No secret found, but it increases operational risk and repo noise.

Recommended fix:

- Move project-local agent permissions to `.claude/settings.local.json` if possible.
- Review whether `.claude/settings.json` should be committed at all.

## Areas That Look Good

- `.env.local`, `.vercel`, `.next`, `node_modules`, MCP app env files and Supabase temp files are ignored.
- Secret scan over tracked files did not find real API keys.
- `client_integration_secrets` has RLS enabled and authenticated/anon grants revoked in migrations.
- Stripe webhook uses `stripe.webhooks.constructEvent`.
- Resend webhook uses `standardwebhooks`.
- WhatsApp webhook validates Meta signature when configured.
- Cron routes fail closed when `CRON_SECRET` is missing.
- Subscription checkout validates profile, billing and Holded integration before monthly checkout.
- Document download uses ownership check and 5-minute signed URLs.

## Dependency Audit

Command:

```bash
npm audit --json
```

Result:

- Total: 3 vulnerabilities.
- High: 1 package (`xlsx`).
- Moderate: 2 entries (`next` via bundled `postcss`).

Notes:

- `npm audit` suggests an unusable semver-major downgrade for `next`; do not apply blindly.
- Track upstream Next/PostCSS advisory and patch when a safe compatible Next version is available.

## Cloud Copy Guidance

Safe cloud copy rules:

- Do not include `.env.local`, `.env.development.local`, `.vercel`, `node_modules`, `.next*`, or MCP app env files.
- Do not include `.claude/settings.json` changes unless intentionally reviewed.
- Prefer a GitHub backup branch containing only committed safe files.

Recommended branch name:

```text
backup/security-audit-2026-06-02
```

## Next Fix Order

1. Patch OAuth state/role validation for Gmail, MS365 and Google Calendar.
2. Set Holded MCP bridge cookie `httpOnly: true`.
3. Standardize login return param to `next` or server-side bridge nonce.
4. Add rate limit/reCAPTCHA to `/api/services/viabilidad`.
5. Add active-user enforcement for inactive profiles.
6. Replace or isolate `xlsx`.
7. Add file upload allowlist and scanning path.
8. Introduce CSP in report-only mode.
9. Normalize admin/owner/collaborator role helpers.

## Validation Performed

- Workspace check: OK after restoring `D:` alias to `H:\`.
- Node/npm restored via Scoop.
- Secret scan over tracked files: no real secrets found.
- `npm audit --json`: completed; findings documented.
- Targeted ESLint on patched files: passed.

Global `typecheck`/`lint` were attempted earlier but exceeded the local timeout and left Node child processes; those processes were stopped. Re-run global checks in CI or with longer timeout after this audit branch is pushed.
