// Usage: node scripts/check_package.mjs <path to the npm pack tarball>
// Checks the exact file list, the package metadata, and that no file carries local paths,
// credentials or (via the optional DIST_EXTRA_DENY regex) site-specific names.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const tgz = process.argv[2]
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const problems = []

const files = execFileSync('tar', ['-tzf', tgz], { encoding: 'utf8' }).trim().split('\n').sort()
const expected = [
  'package/LICENSE',
  'package/README.md',
  'package/dist/index.js',
  'package/dist/index.js.map',
  'package/dist/templates/python-build-async.hbs',
  'package/dist/templates/python-build-sync.hbs',
  'package/dist/templates/python-template.hbs',
  'package/dist/templates/readme.hbs',
  'package/dist/templates/typescript-build.hbs',
  'package/dist/templates/typescript-template.hbs',
  'package/package.json',
].sort()
if (JSON.stringify(files) !== JSON.stringify(expected)) {
  problems.push(`file list differs:\n  got      ${files.join(' ')}\n  expected ${expected.join(' ')}`)
}

const read = (f) => execFileSync('tar', ['-xzOf', tgz, f], { maxBuffer: 64 << 20 }).toString('utf8')
const meta = JSON.parse(read('package/package.json'))
for (const [k, v] of [['name', '@boxfab/cli'], ['version', pkg.version], ['license', 'MIT']]) {
  if (meta[k] !== v) problems.push(`package.json ${k} is ${meta[k]}, expected ${v}`)
}
if (meta.bin?.boxfab !== 'dist/index.js') problems.push('package.json bin.boxfab must be dist/index.js')

const deny = [
  [/\/home\/(?!user\b)[a-z_][a-z0-9_-]*\//, 'local home path'],
  [/\/tmp\/claude-\d+/, 'local temp path'],
  [/\be2b_[0-9a-f]{40}\b/, 'API key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
]
if (process.env.DIST_EXTRA_DENY) deny.push([new RegExp(process.env.DIST_EXTRA_DENY, 'i'), 'site-specific name'])
for (const f of files) {
  if (!/\.(js|map|json|md|hbs)$|LICENSE/.test(f)) continue
  const text = read(f)
  for (const [rx, what] of deny) {
    const m = text.match(rx)
    if (m) problems.push(`${f}: ${what} (${m[0].slice(0, 12)}…)`)
  }
}

if (problems.length) {
  console.error('package check failed:\n  ' + problems.join('\n  '))
  process.exit(1)
}
console.log(`${tgz}: ${files.length} files, ${meta.name}@${meta.version}: OK`)
