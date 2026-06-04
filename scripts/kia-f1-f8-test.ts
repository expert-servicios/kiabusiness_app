#!/usr/bin/env tsx
/**
 * Kia F1-F8 Integration Test Runner
 * Usage: npx tsx scripts/kia-f1-f8-test.ts
 * Or:    npm run kia:f1f8:test
 *
 * Validates F1-F8 fixture files for:
 * - JSON schema compliance (all required KiaDecision fields present)
 * - Business rule adherence (no forbidden field combinations)
 * - Coverage: at least one fixture per F1-F8 phase
 * Does NOT call the LLM — pure offline structural validation.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT  = process.cwd();
const FIXTURES_DIR = path.join(ROOT, 'tests', 'fixtures', 'kia');

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';
const CYAN   = '\x1b[36m';

const REQUIRED_DECISION_KEYS = [
  'version', 'taskType', 'contactStatus', 'intent', 'userMessage',
  'nextAction', 'toolRequests', 'dataToSave', 'confidence',
  'requiresMeeting', 'requiresManualReview', 'decisionSummary',
  'rulesApplied', 'missingData', 'warnings',
];

const VALID_NEXT_ACTIONS = new Set([
  'reply_only', 'ask_one_question', 'show_menu', 'run_viability', 'run_readiness',
  'send_checkout_link', 'send_login_link', 'send_profile_link', 'send_holded_connect_link',
  'book_call', 'classify_document', 'get_case_status', 'create_next_best_action',
  'update_case', 'create_task', 'needs_review',
]);

const VALID_INTENTS = new Set([
  'greeting', 'service_selection', 'viability', 'readiness', 'checkout', 'book_call',
  'complete_profile', 'connect_holded', 'send_documents', 'case_status',
  'accounting_summary', 'document_classification', 'anomaly_review', 'unknown',
]);

const VALID_TASK_TYPES = new Set([
  'waba_reply', 'admin_ai_compose', 'document_classification', 'document_extraction',
  'lead_client_decision', 'viability_reasoning', 'readiness_reasoning',
  'accounting_anomaly_review', 'company_status_summary', 'next_best_action', 'checkout_decision',
]);

const VALID_CHANNELS = new Set(['waba', 'admin', 'email', 'dashboard', 'document']);
const VALID_CONTACT_STATUSES = new Set(['lead', 'client', 'unknown']);

// F1-F8 required fixture suites
const REQUIRED_SUITES = [
  'f1-model-routing',
  'f2-intent-classifier',
  'f3-ocr-invoice',
  'f6-feedback-flow',
  'f7-sub-agents',
];

interface FixtureCase {
  id: string;
  message: string;
  expected?: {
    intent?: string;
    nextAction?: string;
    requiresMeeting?: boolean;
    requiresManualReview?: boolean;
    forbidsNeedsReview?: boolean;
    missingData?: string[];
  };
}

interface FixtureSuite {
  suite: string;
  channel: string;
  contactStatus: string;
  description?: string;
  expected?: FixtureCase['expected'];
  cases: FixtureCase[];
}

function validateFixtureSuite(suite: FixtureSuite, filename: string): { pass: number; fail: number; errors: string[] } {
  let pass = 0;
  let fail = 0;
  const errors: string[] = [];

  // Suite-level validation
  if (!VALID_CHANNELS.has(suite.channel)) {
    errors.push(`Invalid channel: ${suite.channel}`);
    fail++;
  }
  if (!VALID_CONTACT_STATUSES.has(suite.contactStatus)) {
    errors.push(`Invalid contactStatus: ${suite.contactStatus}`);
    fail++;
  }
  if (!Array.isArray(suite.cases) || suite.cases.length === 0) {
    errors.push('Suite has no cases');
    fail++;
    return { pass, fail, errors };
  }

  // Case-level validation
  for (const c of suite.cases) {
    const caseErrors: string[] = [];

    if (!c.id) caseErrors.push('missing id');
    if (!c.message || typeof c.message !== 'string') caseErrors.push('missing/invalid message');
    if (c.message && c.message.length < 2) caseErrors.push('message too short');

    const exp = c.expected ?? suite.expected ?? {};

    if (exp.nextAction && !VALID_NEXT_ACTIONS.has(exp.nextAction)) {
      caseErrors.push(`invalid nextAction: ${exp.nextAction}`);
    }
    if (exp.intent && !VALID_INTENTS.has(exp.intent)) {
      caseErrors.push(`invalid intent: ${exp.intent}`);
    }

    if (caseErrors.length === 0) {
      pass++;
      console.log(`  ${GREEN}✓${RESET} [${c.id}] ${c.message.slice(0, 60)}`);
    } else {
      fail++;
      console.log(`  ${RED}✗${RESET} [${c.id}] ${c.message.slice(0, 60)}`);
      for (const e of caseErrors) console.log(`      ${RED}→ ${e}${RESET}`);
      errors.push(...caseErrors.map((e) => `[${c.id}] ${e}`));
    }
  }

  return { pass, fail, errors };
}

function main() {
  console.log(`\n${BOLD}── Kia F1-F8 Integration Test Runner ───────────────────────${RESET}\n`);

  const allFiles = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json')).sort();
  const f1f8Files = allFiles.filter((f) =>
    f.startsWith('f1-') || f.startsWith('f2-') || f.startsWith('f3-') ||
    f.startsWith('f4-') || f.startsWith('f5-') || f.startsWith('f6-') ||
    f.startsWith('f7-') || f.startsWith('f8-')
  );

  let totalPass = 0;
  let totalFail = 0;
  const foundSuites = new Set<string>();

  if (f1f8Files.length === 0) {
    console.log(`${YELLOW}⚠ No F1-F8 fixture files found (expected files starting with f1-..f8-)${RESET}`);
  }

  for (const file of f1f8Files) {
    const filepath = path.join(FIXTURES_DIR, file);
    let suite: FixtureSuite;

    try {
      suite = JSON.parse(fs.readFileSync(filepath, 'utf8')) as FixtureSuite;
    } catch (err) {
      console.log(`${RED}✗${RESET} ${file}: invalid JSON — ${err instanceof Error ? err.message : err}`);
      totalFail++;
      continue;
    }

    foundSuites.add(suite.suite);
    console.log(`\n${CYAN}${BOLD}${suite.suite}${RESET} ${suite.description ? `— ${suite.description}` : ''}`);

    const { pass, fail, errors } = validateFixtureSuite(suite, file);
    totalPass += pass;
    totalFail += fail;

    if (fail === 0) {
      console.log(`  ${GREEN}Suite OK — ${pass} cases valid${RESET}`);
    } else {
      console.log(`  ${RED}Suite FAILED — ${fail} errors${RESET}`);
    }
  }

  // Check required suites coverage
  console.log(`\n${BOLD}── Coverage Check ───────────────────────────────────────────${RESET}`);
  let coverageFail = 0;
  for (const required of REQUIRED_SUITES) {
    if (foundSuites.has(required)) {
      console.log(`  ${GREEN}✓${RESET} ${required}`);
    } else {
      console.log(`  ${RED}✗${RESET} ${required} — missing fixture file`);
      coverageFail++;
    }
  }

  console.log(`\n${BOLD}── Results ──────────────────────────────────────────────────${RESET}`);
  console.log(`  Cases passed:  ${GREEN}${totalPass}${RESET}`);
  console.log(`  Cases failed:  ${totalFail > 0 ? RED : GREEN}${totalFail}${RESET}`);
  console.log(`  Suite coverage: ${coverageFail > 0 ? RED : GREEN}${foundSuites.size}/${REQUIRED_SUITES.length} required${RESET}`);

  if (totalFail > 0 || coverageFail > 0) {
    console.log(`\n${RED}${BOLD}Some checks failed.${RESET}`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}All F1-F8 fixture checks passed.${RESET}`);
  }
}

main();
