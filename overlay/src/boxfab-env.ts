/**
 * BoxFab environment. Imported first by src/index.ts, before any module reads the environment.
 *
 * The CLI and the bundled `boxfab` JS SDK read only BOXFAB_* variables, so an E2B key or domain
 * inherited from the user's shell is never used and a key is never sent to E2B's service.
 * BOXFAB_DOMAIN defaults to boxfab.io (the SDK's default too); setting it here makes the CLI's
 * own output and the processes it starts (template build scripts) see the same value.
 */

export const DEFAULT_DOMAIN = 'boxfab.io'

export function applyBoxfabEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (!env.BOXFAB_DOMAIN) env.BOXFAB_DOMAIN = DEFAULT_DOMAIN
}

applyBoxfabEnv()
