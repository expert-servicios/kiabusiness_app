#!/usr/bin/env tsx
/**
 * Kia Auditor test runner
 * Usage: npx tsx scripts/kia-auditor-test.ts
 * Or:    npm run kia:auditor:test
 *
 * Runs the deterministic grader over all fixtures and checks expected outcomes.
 * Does NOT call the LLM judge (offline/fast mode).
 * Exits with code 1 if any critical rule fails detection.
 */

import { KIA_AUDITOR_FIXTURES } from '../lib/ai/kia-auditor/kia-auditor-fixtures';
import { runDeterministicGrader, scoreFromRuleResults } from '../lib/ai/kia-auditor/kia-auditor-grader';

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';

let totalPass = 0;
let totalFail = 0;
let criticalMissed = 0;

console.log(`\n${BOLD}── Kia Auditor Test Runner ──────────────────────────────────${RESET}\n`);

for (const fixture of KIA_AUDITOR_FIXTURES) {
  const ruleResults = runDeterministicGrader(fixture.input);
  const { score, hasCriticalFailure } = scoreFromRuleResults(ruleResults);

  const actualStatus: 'pass' | 'warning' | 'fail' = hasCriticalFailure
    ? 'fail'
    : score < 60
      ? 'warning'
      : ruleResults.some(r => r.status === 'warning') ? 'warning' : 'pass';

  const statusMatch = actualStatus === fixture.expectedStatus
    || (fixture.expectedStatus === 'warning' && (actualStatus === 'warning' || actualStatus === 'fail'));

  // Check expected failed rules
  const failedRules = ruleResults.filter(r => r.status === 'failed' || r.status === 'warning').map(r => r.ruleId);
  const missingExpected = (fixture.expectedFailedRules ?? []).filter(r => !failedRules.includes(r));

  const ok = statusMatch && missingExpected.length === 0;

  if (ok) {
    totalPass++;
    console.log(`${GREEN}✓${RESET} ${fixture.name} (score: ${score}, status: ${actualStatus})`);
  } else {
    totalFail++;
    console.log(`${RED}✗${RESET} ${fixture.name}`);
    if (!statusMatch) {
      console.log(`  Expected status: ${YELLOW}${fixture.expectedStatus}${RESET}, got: ${RED}${actualStatus}${RESET}`);
    }
    if (missingExpected.length > 0) {
      console.log(`  Missing expected failures: ${RED}${missingExpected.join(', ')}${RESET}`);
      criticalMissed++;
    }
    console.log(`  Rule results:`);
    for (const r of ruleResults.filter(r => r.status !== 'skipped')) {
      const icon = r.status === 'passed' ? GREEN + '✓' : RED + '✗';
      console.log(`    ${icon}${RESET} ${r.ruleId} (${r.status})`);
    }
  }
}

console.log(`\n${BOLD}── Results ─────────────────────────────────────────────────${RESET}`);
console.log(`  Passed: ${GREEN}${totalPass}${RESET}`);
console.log(`  Failed: ${totalFail > 0 ? RED : GREEN}${totalFail}${RESET}`);
console.log(`  Critical rules missed: ${criticalMissed > 0 ? RED : GREEN}${criticalMissed}${RESET}`);
console.log('');

if (criticalMissed > 0) {
  console.error(`${RED}${BOLD}FAIL: ${criticalMissed} critical rule(s) were not detected by the deterministic grader.${RESET}`);
  process.exit(1);
}

if (totalFail > 0) {
  console.warn(`${YELLOW}${BOLD}WARNING: ${totalFail} fixture(s) did not match expected status.${RESET}`);
  process.exit(0);
}

console.log(`${GREEN}${BOLD}All fixtures passed.${RESET}`);
process.exit(0);
