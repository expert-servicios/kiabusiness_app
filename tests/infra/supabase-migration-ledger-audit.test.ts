import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = path.join(process.cwd(), 'scripts', 'audit-supabase-migration-ledger.mjs');
const tempRoots: string[] = [];

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expert-ledger-audit-'));
  const migrations = path.join(root, 'migrations');
  fs.mkdirSync(migrations);
  tempRoots.push(root);

  const ledger = path.join(root, 'ledger.json');
  return { root, migrations, ledger };
}

function writeLedger(file: string, rows: Array<Record<string, unknown>>) {
  fs.writeFileSync(file, JSON.stringify(rows), 'utf8');
}

function writeMigration(dir: string, filename: string) {
  fs.writeFileSync(path.join(dir, filename), '-- fixture\nselect 1;\n', 'utf8');
}

function run(ledger: string, migrations: string, extraArgs: string[] = []) {
  return execFileSync(
    process.execPath,
    [script, ledger, `--migrations-dir=${migrations}`, ...extraArgs],
    { encoding: 'utf8' },
  );
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('Supabase migration ledger auditor', () => {
  it('reports ALIGNED when local and remote timestamp sets match', () => {
    const { migrations, ledger } = fixture();
    writeMigration(migrations, '20260901000000_alpha.sql');
    writeLedger(ledger, [
      {
        version: '20260901000000',
        name: 'alpha',
        statement_count: 1,
        statements_md5: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
    ]);

    const output = run(ledger, migrations);

    expect(output).toContain('exact timestamp intersection: 1');
    expect(output).toContain('Remote versions missing locally (0)');
    expect(output).toContain('Local versions missing remotely (0)');
    expect(output).toContain('result: ALIGNED');
  });

  it('reports remote-only drift and fails in strict mode', () => {
    const { migrations, ledger } = fixture();
    writeLedger(ledger, [
      {
        version: '20260901000001',
        name: 'remote_only',
        statement_count: 1,
        statements_md5: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
    ]);

    const nonStrict = run(ledger, migrations);
    expect(nonStrict).toContain('Remote versions missing locally (1)');
    expect(nonStrict).toContain('20260901000001 remote_only');
    expect(nonStrict).toContain('result: DRIFT');

    const strict = spawnSync(
      process.execPath,
      [script, ledger, `--migrations-dir=${migrations}`, '--strict'],
      { encoding: 'utf8' },
    );

    expect(strict.status).toBe(1);
    expect(strict.stdout).toContain('result: DRIFT');
  });

  it('detects duplicate local timestamp prefixes', () => {
    const { migrations, ledger } = fixture();
    writeMigration(migrations, '20260901000002_first.sql');
    writeMigration(migrations, '20260901000002_second.sql');
    writeLedger(ledger, [
      {
        version: '20260901000002',
        name: 'first',
        statement_count: 1,
        statements_md5: 'cccccccccccccccccccccccccccccccc',
      },
    ]);

    const output = run(ledger, migrations);

    expect(output).toContain('Duplicate local timestamp prefixes (1)');
    expect(output).toContain('20260901000002_first.sql');
    expect(output).toContain('20260901000002_second.sql');
    expect(output).toContain('result: DRIFT');
  });

  it('reports repeated remote names and hashes as information when timestamps are aligned', () => {
    const { migrations, ledger } = fixture();
    writeMigration(migrations, '20260901000003_repeat.sql');
    writeMigration(migrations, '20260901000004_repeat_again.sql');
    writeLedger(ledger, [
      {
        version: '20260901000003',
        name: 'repeat',
        statement_count: 1,
        statements_md5: 'dddddddddddddddddddddddddddddddd',
      },
      {
        version: '20260901000004',
        name: 'repeat',
        statement_count: 1,
        statements_md5: 'dddddddddddddddddddddddddddddddd',
      },
    ]);

    const output = run(ledger, migrations, ['--strict']);

    expect(output).toContain('Repeated remote migration names (1)');
    expect(output).toContain('Repeated remote statement hashes (1)');
    expect(output).toContain('result: ALIGNED');
  });
});
