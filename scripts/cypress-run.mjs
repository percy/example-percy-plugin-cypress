// Launcher for `npm run cy:run` — makes Cypress launch reliably from ANY
// shell, including agent/IDE subshells. Two independent protections:
//
// 1. Strips ELECTRON_RUN_AS_NODE from the child env. Electron-based IDEs
//    (VS Code, Claude Code desktop, Cursor…) inject ELECTRON_RUN_AS_NODE=1
//    into subprocess environments; it forces Cypress's Electron binary to
//    boot as plain Node, which dies with the signature error
//    "Cannot find module …Cypress.app/Contents/MacOS/Contents/Resources/app/
//    index.js" (note the doubled Contents). The binary is fine — the env
//    var is the poison. (Reproduced + fix verified 2026-07-15.)
// 2. Pins CYPRESS_RUN_BINARY to the locally cached Cypress.app so cypress's
//    binary resolution never runs (package-proxy shims can corrupt it).
// 3. Strips HTTP(S)_PROXY from the child env. Agent/IDE sandboxes (e.g. the
//    package-manager proxy `pmg`) inject HTTP_PROXY/HTTPS_PROXY pointing at a
//    local forward proxy. Cypress does NOT honor NO_PROXY for its baseUrl
//    verification, so it routes the http://localhost check through that proxy
//    and dies with "Cypress could not verify that this server is running".
//    A `cypress run` against a localhost app needs no outbound proxy, so we
//    drop the vars entirely. (Reproduced + fix verified 2026-07-15.)
//
// On machines without a macOS cache (CI/Linux), the pin is a no-op passthrough.
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

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']) delete env[k]

const cypressCli = join('node_modules', '.bin', 'cypress')
const r = spawnSync(cypressCli, ['run', ...process.argv.slice(2)], { stdio: 'inherit', env })
process.exit(r.status ?? 1)
