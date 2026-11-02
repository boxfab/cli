import * as commander from 'commander'
import * as e2b from 'e2b'
import { password } from '@inquirer/prompts'

import { DASHBOARD_BASE, getUserConfig, USER_CONFIG_PATH, writeUserConfig } from 'src/user'
import { asBold, asFormattedError } from 'src/utils/format'

/** Checks the key against the API; returns null if it works, otherwise the reason. */
export async function checkApiKey(apiKey: string): Promise<string | null> {
  const config = new e2b.ConnectionConfig({ apiKey })
  try {
    const res = await fetch(`${config.apiUrl}/v2/sandboxes?limit=1`, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(30_000),
    })
    if (res.ok) return null
    return res.status === 401 || res.status === 403
      ? 'the API key was rejected'
      : `the API answered HTTP ${res.status}`
  } catch (err) {
    return `could not reach ${config.apiUrl}: ${err instanceof Error ? err.message : err}`
  }
}

export const loginCommand = new commander.Command('login')
  .description('log in to the CLI with a team API key')
  .option('--api-key <key>', 'API key (prompted for when omitted)')
  .action(async (opts: { apiKey?: string }) => {
    if (getUserConfig()) {
      console.log(
        `Already logged in (${USER_CONFIG_PATH}). Run ${asBold('boxfab auth logout')} first to use a different key.`
      )
      return
    }
    const apiKey = (
      opts.apiKey ??
      (await password({
        message: `API key (from ${DASHBOARD_BASE} or your BoxFab administrator):`,
        mask: true,
      }))
    ).trim()
    if (!apiKey) {
      console.info('Login aborted')
      return
    }
    const problem = await checkApiKey(apiKey)
    if (problem) {
      console.error(asFormattedError(`Login failed: ${problem}`))
      process.exit(1)
    }
    writeUserConfig(USER_CONFIG_PATH, { version: 2, projectApiKey: apiKey })
    console.log(`Logged in. The key is stored in ${asBold(USER_CONFIG_PATH)}.`)
    process.exit(0)
  })
