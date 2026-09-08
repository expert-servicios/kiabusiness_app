#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const jsonPath = args.find((arg) => !arg.startsWith('--'));

if (!jsonPath) {
  console.error('Usage: node scripts/audit-supabase-migration-ledger.mjs <remote-ledger.json> [--strict]');
  process.exit(2);
}

function readRemoteLedger(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Accept either the direct JSON array produced by the export query or a
  // wrapper object such as { ledger: [...] } saved by a client/tool.
  const rows = Array.isArray(raw) ? raw : raw?.ledger;
  if (!Array.isArray(rows)) {
    throw new Error('Remote ledger JSON must be an array or an object with a ledger array.');
  }

  return rows.map((row, index) => {
    const version = String(row?.version ?? '');
    if (!/^\d{14}$/.test(version)) {
      throw new Error(`Invalid remote migration version at row ${index}: ${version}`);
    }
    return {
      version,
      name: String(row?.name ?? ''),
      statements_md5: row?.statements_md5 ? String(row.statements_md5) : null,
      statement_count: Number(row?.statement_count ?? 0),
    };
  });
}

function readLocalMigrations(root) {
  const migrationDir = path.join(root, 'supabase', 'migrations');
  const files = fs.readdirSync(migrationDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();

  return files.map((file) => {
    const match = file.match(/^(\d{14})_(.+)\.sql$/);
    if (!match) {
      return { file, version: null, name: null };
    }
    return { file, version: match[1], name: match[2] };
  });
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (key == null) continue;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function printSection(title, rows, format) {
  console.log(`\n${title} (${rows.length})`);
  if (rows.length === 0) {
    console.log('  none');
    return;
  }
  for (const row of rows) console.log(`  ${format(row)}`);
}

const repoRoot = process.cwd();
const remote = readRemoteLedger(path.resolve(jsonPath));
const local = readLocalMigrations(repoRoot);
const validLocal = local.filter((row) => row.version);
const invalidLocal = local.filter((row) => !row.version);

const remoteByVersion = groupBy(remote, (row) => row.version);
const localByVersion = groupBy(validLocal, (row) => row.version);

const remoteVersions = new Set(remoteByVersion.keys());
const localVersions = new Set(localByVersion.keys());

const remoteOnly = [...remoteVersions]
  .filter((version) => !localVersions.has(version))
  .sort()
  .flatMap((version) => remoteByVersion.get(version));

const localOnly = [...localVersions]
  .filter((version) => !remoteVersions.has(version))
  .sort()
  .flatMap((version) => localByVersion.get(version));

const duplicateLocalVersions = [...localByVersion.entries()]
  .filter(([, rows]) => rows.length > 1)
  .sort(([a], [b]) => a.localeCompare(b));

const duplicateRemoteVersions = [...remoteByVersion.entries()]
  .filter(([, rows]) => rows.length > 1)
  .sort(([a], [b]) => a.localeCompare(b));

const byRemoteName = groupBy(remote, (row) => row.name || null);
const repeatedRemoteNames = [...byRemoteName.entries()]
  .filter(([, rows]) => rows.length > 1)
  .sort(([a], [b]) => a.localeCompare(b));

const byHash = groupBy(remote.filter((row) => row.statements_md5), (row) => row.statements_md5);
const repeatedRemoteHashes = [...byHash.entries()]
  .filter(([, rows]) => rows.length > 1)
  .sort(([a], [b]) => a.localeCompare(b));

const exactVersions = [...remoteVersions].filter((version) => localVersions.has(version)).sort();

console.log('Supabase migration ledger timestamp audit');
console.log(`remote rows: ${remote.length}`);
console.log(`remote unique versions: ${remoteVersions.size}`);
console.log(`local SQL files: ${local.length}`);
console.log(`local unique versions: ${localVersions.size}`);
console.log(`exact timestamp intersection: ${exactVersions.length}`);

printSection('Remote versions missing locally', remoteOnly, (row) => `${row.version} ${row.name}`);
printSection('Local versions missing remotely', localOnly, (row) => `${row.version} ${row.file}`);
printSection(
  'Duplicate local timestamp prefixes',
  duplicateLocalVersions,
  ([version, rows]) => `${version}: ${rows.map((row) => row.file).join(', ')}`,
);
printSection(
  'Duplicate remote version rows',
  duplicateRemoteVersions,
  ([version, rows]) => `${version}: ${rows.map((row) => row.name).join(', ')}`,
);
printSection(
  'Repeated remote migration names',
  repeatedRemoteNames,
  ([name, rows]) => `${name}: ${rows.map((row) => row.version).join(', ')}`,
);
printSection(
  'Repeated remote statement hashes',
  repeatedRemoteHashes,
  ([hash, rows]) => `${hash}: ${rows.map((row) => `${row.version}:${row.name}`).join(', ')}`,
);
printSection('Local SQL filenames without a 14-digit migration prefix', invalidLocal, (row) => row.file);

const driftFound = remoteOnly.length > 0
  || localOnly.length > 0
  || duplicateLocalVersions.length > 0
  || duplicateRemoteVersions.length > 0
  || invalidLocal.length > 0;

console.log(`\nresult: ${driftFound ? 'DRIFT' : 'ALIGNED'}`);

if (strict && driftFound) process.exit(1);
