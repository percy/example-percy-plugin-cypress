// Launcher for `npm run cy:run` — pins CYPRESS_RUN_BINARY to the locally
// cached Cypress.app so cypress's own binary resolution never runs.
// That resolution step is corrupted by package-proxy shims (PMG) in some
// shells (symptom: "Cannot find module …Cypress.app/Contents/MacOS/Contents/
// Resources/app/index.js" — note the doubled Contents). The cached binary
// itself is real and `cypress verify` passes; only the lookup breaks.
// On machines without a macOS cache (CI/Linux), this is a no-op passthrough.
import { existsSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

if (!process.env.CYPRESS_RUN_BINARY) {
  const cache = join(homedir(), 'Library', 'Caches', 'Cypress')
  let version = null
  try {
    version = createRequire(import.meta.url)('cypress/package.json').version
  } catch { /* fall through to newest cached */ }
  const candidates = []
  if (version) candidates.push(version)
  if (existsSync(cache)) {
    candidates.push(...readdirSync(cache).filter(d => /^\d+\.\d+\.\d+$/.test(d)).sort().reverse())
  }
  for (const v of candidates) {
    const bin = join(cache, v, 'Cypress.app', 'Contents', 'MacOS', 'Cypress')
    if (existsSync(bin)) { process.env.CYPRESS_RUN_BINARY = bin; break }
  }
}

const cypressCli = join('node_modules', '.bin', 'cypress')
const r = spawnSync(cypressCli, ['run', ...process.argv.slice(2)], { stdio: 'inherit', env: process.env })
process.exit(r.status ?? 1)
