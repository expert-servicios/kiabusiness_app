#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const migrationsDirArg = args.find((arg) => arg.startsWith('--migrations-dir='));
const jsonOutputArg = args.find((arg) => arg.startsWith('--json-output='));
const jsonPath = args.find((arg) => !arg.startsWith('--'));

if (!jsonPath) {
  console.error(
    'Usage: node scripts/audit-supabase-migration-ledger.mjs <remote-ledger.json> [--strict] [--migrations-dir=<path>] [--json-output=<path>]',
  );
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

function readLocalMigrations(migrationDir) {
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

const migrationsDir = migrationsDirArg
  ? path.resolve(migrationsDirArg.slice('--migrations-dir='.length))
  : path.join(process.cwd(), 'supabase', 'migrations');

const remote = readRemoteLedger(path.resolve(jsonPath));
const local = readLocalMigrations(migrationsDir);
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

const driftFound = remoteOnly.length > 0
  || localOnly.length > 0
  || duplicateLocalVersions.length > 0
  || duplicateRemoteVersions.length > 0
  || invalidLocal.length > 0;

const manifest = {
  source_ledger: path.basename(jsonPath),
  counts: {
    remote_rows: remote.length,
    remote_unique_versions: remoteVersions.size,
    local_sql_files: local.length,
    local_unique_versions: localVersions.size,
    exact_timestamp_intersection: exactVersions.length,
  },
  exact_versions: exactVersions,
  remote_only: remoteOnly.map((row) => ({
    version: row.version,
    name: row.name,
    statement_count: row.statement_count,
    statements_md5: row.statements_md5,
  })),
  local_only: localOnly.map((row) => ({
    version: row.version,
    file: row.file,
    name: row.name,
  })),
  duplicate_local_versions: duplicateLocalVersions.map(([version, rows]) => ({
    version,
    files: rows.map((row) => row.file),
  })),
  duplicate_remote_versions: duplicateRemoteVersions.map(([version, rows]) => ({
    version,
    migrations: rows.map((row) => ({ name: row.name, statements_md5: row.statements_md5 })),
  })),
  repeated_remote_names: repeatedRemoteNames.map(([name, rows]) => ({
    name,
    versions: rows.map((row) => row.version),
  })),
  repeated_remote_hashes: repeatedRemoteHashes.map(([statementsMd5, rows]) => ({
    statements_md5: statementsMd5,
    migrations: rows.map((row) => ({ version: row.version, name: row.name })),
  })),
  invalid_local_filenames: invalidLocal.map((row) => row.file),
  result: driftFound ? 'DRIFT' : 'ALIGNED',
};

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

console.log(`\nresult: ${manifest.result}`);

if (jsonOutputArg) {
  const outputPath = path.resolve(jsonOutputArg.slice('--json-output='.length));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`manifest: ${outputPath}`);
}

if (strict && driftFound) process.exit(1);
