/**
 * scripts/postbuild-mac.mjs
 *
 * Post-build step for macOS DMG builds (run automatically by `npm run dist:mac`).
 *
 * Why this exists:
 *   Electron ships with its own ad-hoc code signature, but older Electron releases
 *   (≤ 31.x) bundle a revoked notarization ticket. macOS Gatekeeper's OCSP check
 *   sees the revoked cert and shows "contains malware" — even though the app is
 *   perfectly safe. Re-signing with a fresh local ad-hoc identity (-) replaces the
 *   revoked chain with a clean one, and stripping the quarantine xattr prevents
 *   Gatekeeper from blocking the first launch of a locally-built app.
 *
 * This is NOT a substitute for proper Apple Developer ID signing when distributing
 * publicly. For internal / personal use it is sufficient.
 */

import { execSync } from 'node:child_process'
import { existsSync }  from 'node:fs'
import { join }        from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname

const apps = [
  join(ROOT, 'release/mac-arm64/InvoStack.app'),
  join(ROOT, 'release/mac/InvoStack.app'),
]

for (const app of apps) {
  if (!existsSync(app)) {
    console.log(`  skip  ${app} (not built for this arch)`)
    continue
  }

  // 1. Strip quarantine — prevents "unidentified developer" hard-block on first run.
  try {
    execSync(`xattr -cr "${app}"`, { stdio: 'pipe' })
    console.log(`  ✓ quarantine stripped  ${app}`)
  } catch {
    console.warn(`  ⚠ xattr failed (not on macOS?)  ${app}`)
  }

  // 2. Re-sign with a clean local ad-hoc identity.
  //    --force   replaces Electron's bundled (possibly revoked) signature.
  //    --deep    re-signs all nested frameworks and helpers.
  //    -         the ad-hoc signing identity (no certificate needed).
  try {
    execSync(`codesign --force --deep --sign - "${app}"`, { stdio: 'pipe' })
    console.log(`  ✓ re-signed (ad-hoc)   ${app}`)
  } catch (err) {
    console.warn(`  ⚠ codesign failed: ${err.message}`)
  }
}

console.log('\n✅ macOS post-build complete.')
console.log('   To open the app: right-click InvoStack.app → Open (first launch only).\n')
