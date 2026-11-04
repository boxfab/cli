// Checks dist/index.js after the bundle is built: the bundled SDK must be the `boxfab` JS SDK (its
// BoxFab messages are present), and nothing in the bundle may read an E2B_* configuration
// variable or point users at E2B's site. A dependency change that brings the `e2b` SDK back, or
// an upstream sync that misses a rewrite, fails the build here.
import { readFileSync } from 'node:fs'

const FILE = new URL('../dist/index.js', import.meta.url)
const text = readFileSync(FILE, 'utf8')

const MUST = [
  // boxfab SDK: missing-key message and the template-build error (both rewritten by that SDK).
  'Get one from your BoxFab administrator or the dashboard at https://dashboard.boxfab.io',
  'Templates based on other templates can only be built using the BoxFab API.',
  // the CLI's own configuration
  'BOXFAB_API_KEY',
  'BOXFAB_DOMAIN',
]
const MUST_NOT = [
  [/\bE2B_(API_KEY|ACCESS_TOKEN|DOMAIN|API_URL|SANDBOX_URL|DEBUG|PROJECT_ID|TEAM_ID|DOCS_BASE|DASHBOARD_BASE)\b/, 'E2B_* configuration variable'],
  [/https?:\/\/(www\.|docs\.)?e2b\.dev\b/, 'link to e2b.dev'],
  [/https?:\/\/[a-z0-9.-]*\.?e2b\.app\b/, 'URL on e2b.app'],
  [/e2b-js-sdk\//, 'e2b SDK user agent'],
]

const problems = []
for (const s of MUST) if (!text.includes(s)) problems.push(`missing: ${s}`)
for (const [rx, what] of MUST_NOT) {
  const m = text.match(rx)
  if (m) problems.push(`${what}: …${text.slice(Math.max(0, m.index - 40), m.index + 40)}…`)
}
if (problems.length) {
  console.error('postbuild: bundle check failed:\n  ' + problems.join('\n  '))
  process.exit(1)
}
console.log(`postbuild: bundle OK (boxfab SDK, no E2B_* variables or E2B links)`)
