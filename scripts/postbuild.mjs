// Rewrites user-visible messages of the bundled `e2b` JS SDK in dist/index.js. Each replacement
// must match exactly once, so an SDK upgrade that changes the text fails the build instead of
// shipping the old message.
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = new URL('../dist/index.js', import.meta.url)
const RULES = [
  [
    'API key is required, please visit the API Keys tab at https://e2b.dev/dashboard?tab=keys to get your API key. You can either set the environment variable `E2B_API_KEY` or you can pass it directly to the sandbox like Sandbox.create({ apiKey: \'e2b_...\' })',
    'API key is required. Run `boxfab auth login` or set the environment variable `BOXFAB_API_KEY`; keys are shown at https://dashboard.boxfab.io',
  ],
  [
    'Templates based on other templates can only be built using the E2B API.',
    'Templates based on other templates can only be built using the BoxFab API.',
  ],
]

let text = readFileSync(FILE, 'utf8')
for (const [from, to] of RULES) {
  const n = text.split(from).length - 1
  if (n !== 1) {
    console.error(`postbuild: expected 1 match, found ${n}: ${from.slice(0, 70)}…`)
    process.exit(1)
  }
  text = text.replace(from, to)
}
writeFileSync(FILE, text)
console.log(`postbuild: ${RULES.length} SDK messages rewritten`)
