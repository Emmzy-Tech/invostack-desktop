/**
 * scripts/ensure-electron.mjs
 *
 * Guarantees the Electron binary exists in node_modules/electron/dist/
 * before the dev server starts. Runs in ~0ms if the binary is already present.
 *
 * Why this exists:
 *   electron's postinstall script downloads the binary from GitHub. On some
 *   systems (network restrictions, partial installs, vite-plugin-electron
 *   triggering npm internally) the dist/ folder gets wiped down to just
 *   LICENSE + version without re-downloading the binary. This script detects
 *   that state and extracts the binary from the local macOS cache instantly,
 *   with no network call required.
 */

import { existsSync } from 'node:fs'
import { execSync }   from 'node:child_process'
import { join }       from 'node:path'
import { homedir }    from 'node:os'

const ROOT       = new URL('..', import.meta.url).pathname
const BINARY     = join(ROOT, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
const DIST       = join(ROOT, 'node_modules/electron/dist')
const VERSION    = '31.7.7'
const CACHE_DIR  = join(homedir(), 'Library/Caches/electron')
const ZIP        = join(CACHE_DIR, `electron-v${VERSION}-darwin-arm64.zip`)

if (existsSync(BINARY)) {
  // Binary is present — nothing to do.
  process.exit(0)
}

console.log('⚠  Electron binary missing — restoring from cache...')

if (!existsSync(ZIP)) {
  console.error(`✗  Cache zip not found at: ${ZIP}`)
  console.error('   Run: node node_modules/electron/install.js')
  process.exit(1)
}

try {
  execSync(`unzip -o -q "${ZIP}" -d "${DIST}"`, { stdio: 'inherit' })
  console.log('✓  Electron binary restored.')
} catch (err) {
  console.error('✗  unzip failed:', err.message)
  process.exit(1)
}
