// Usage: node scripts/check_release_tag.mjs v0.1.0-alpha.1
// Exits non-zero unless the tag is exactly "v" + the version in package.json, and that version is
// a plain semver release or pre-release (no build metadata).
import { readFileSync } from 'node:fs'

const tag = process.argv[2] ?? ''
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/
if (!semver.test(version)) {
  console.error(`package.json version ${version} is not a valid release version`)
  process.exit(1)
}
if (version === '0.0.0') {
  console.error('version 0.0.0 is not releasable')
  process.exit(1)
}
if (tag !== `v${version}`) {
  console.error(`tag ${tag} does not match package.json version (expected v${version})`)
  process.exit(1)
}
console.log(`tag ${tag} OK`)
