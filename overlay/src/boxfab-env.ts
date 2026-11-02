/**
 * BoxFab environment. Imported first by src/index.ts, before any module reads the environment.
 *
 * The CLI and the bundled `e2b` JS SDK read E2B_* variables. A BoxFab install must never pick up
 * an E2B key or domain from the user's shell, nor send a key to E2B's service, so every inherited
 * E2B_* variable is removed and the BOXFAB_* ones are mapped onto the names the code reads.
 * BOXFAB_DOMAIN defaults to boxfab.io.
 */

export const DEFAULT_DOMAIN = 'boxfab.io'

// BOXFAB_<name> is exposed to the code as E2B_<name>.
const MAPPED = [
  'API_KEY',
  'ACCESS_TOKEN',
  'DOMAIN',
  'API_URL',
  'SANDBOX_URL',
  'DEBUG',
  'PROJECT_ID',
  'TEAM_ID',
  'DOCS_BASE',
  'DASHBOARD_BASE',
]

export function applyBoxfabEnv(env: NodeJS.ProcessEnv = process.env): void {
  for (const key of Object.keys(env)) {
    if (key.startsWith('E2B_')) delete env[key]
  }
  for (const name of MAPPED) {
    const value = env[`BOXFAB_${name}`]
    if (value !== undefined && value !== '') env[`E2B_${name}`] = value
  }
  env.E2B_DOMAIN ||= DEFAULT_DOMAIN
}

applyBoxfabEnv()
