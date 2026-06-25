/**
 * Syncs all variables from .env.local → Vercel production + development.
 * Run: node scripts/sync-env-to-vercel.mjs
 * Requires: vercel CLI logged in + project linked (.vercel/project.json)
 */
import { readFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function parseEnv(content) {
  const vars = new Map()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1)
    vars.set(key, value)
  }
  return vars
}

function vercelEnv(args, input = '') {
  const result = spawnSync('vercel', args, {
    cwd: ROOT, input, encoding: 'utf8', shell: true,
  })
  return { ok: result.status === 0, out: (result.stdout || '') + (result.stderr || '') }
}

const content = readFileSync(join(ROOT, '.env.local'), 'utf8')
const vars = parseEnv(content)
const ENVS = ['production', 'development']

console.log(`\nSyncing ${vars.size} variables → Vercel (${ENVS.join(', ')})...\n`)

let ok = 0, fail = 0

for (const [key, value] of vars) {
  let varFailed = false

  for (const env of ENVS) {
    // Remove existing (ignore result — var may not exist yet)
    vercelEnv(['env', 'rm', key, env, '--yes'])

    // Add new value via stdin
    const { ok: added, out } = vercelEnv(['env', 'add', key, env], value)
    if (!added) {
      // Extract meaningful error line (skip plugin hint tags)
      const errLine = out.split('\n').find(l => l.includes('Error:') || l.includes('error:')) || out.split('\n')[0]
      console.error(`  FAIL  ${key} [${env}]: ${errLine.trim()}`)
      varFailed = true
    }
  }

  if (varFailed) {
    fail++
  } else {
    console.log(`  OK    ${key}`)
    ok++
  }
}

console.log(`\n${ok} updated, ${fail} failed\n`)
if (fail > 0) process.exit(1)
