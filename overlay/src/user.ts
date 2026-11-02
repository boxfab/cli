import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

/**
 * BoxFab user configuration, stored in ~/.boxfab/config.json.
 *
 * Upstream signs in through E2B's OAuth (browser) flow and keeps OAuth tokens here. BoxFab signs
 * in with a team API key only, so the config holds the key and nothing else that matters.
 * projectId / projectName stay optional because the shared code reads them; an API key already
 * identifies its team, so they are normally absent.
 */
export interface UserConfig {
  version: 2
  projectApiKey: string
  projectId?: string
  projectName?: string
}

type UnknownRecord = Record<string, unknown>

export const USER_CONFIG_PATH = path.join(os.homedir(), '.boxfab', 'config.json')

export const DOCS_BASE = process.env.E2B_DOCS_BASE || 'https://boxfab.dev/docs'

export const DASHBOARD_BASE =
  process.env.E2B_DASHBOARD_BASE || 'https://dashboard.boxfab.io'

// The BoxFab dashboard serves a sandbox at /sandboxes/<id> (no /inspect/sandbox route).
export const SANDBOX_INSPECT_URL = (sandboxId: string) =>
  `${DASHBOARD_BASE}/sandboxes/${sandboxId}`

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUserConfig(config: unknown): config is UserConfig {
  return (
    isObject(config) &&
    config.version === 2 &&
    typeof config.projectApiKey === 'string' &&
    config.projectApiKey !== ''
  )
}

export function getUserConfig(): UserConfig | null {
  if (!fs.existsSync(USER_CONFIG_PATH)) return null
  const config = JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf8'))
  if (!isUserConfig(config)) return null
  const result: UserConfig = { version: 2, projectApiKey: config.projectApiKey }
  if (typeof config.projectId === 'string' && config.projectId) result.projectId = config.projectId
  if (typeof config.projectName === 'string' && config.projectName) result.projectName = config.projectName
  return result
}

/**
 * Write user config to disk with restrictive file permissions: the directory is owner-only and
 * the file owner-readable/writable only, because it contains the API key.
 */
export function writeUserConfig(configPath: string, config: UserConfig): void {
  const dir = path.dirname(configPath)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  fs.chmodSync(dir, 0o700)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 })
  fs.chmodSync(configPath, 0o600)
}
