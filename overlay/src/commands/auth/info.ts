import * as commander from 'commander'

import { getUserConfig, USER_CONFIG_PATH } from 'src/user'
import { asBold, asFormattedError } from 'src/utils/format'

export const infoCommand = new commander.Command('info')
  .description('show which API key and domain the CLI uses')
  .action(async () => {
    const domain = process.env.E2B_DOMAIN
    const fromEnv = process.env.E2B_API_KEY
    let stored
    try {
      stored = getUserConfig()
    } catch (err) {
      console.error(asFormattedError('Failed to read user config', err))
    }
    const key = fromEnv || stored?.projectApiKey
    if (!key) {
      console.log(`Not logged in (domain ${asBold(domain ?? '')})`)
      return
    }
    const source = fromEnv ? 'BOXFAB_API_KEY' : USER_CONFIG_PATH
    console.log(`Domain: ${asBold(domain ?? '')}\nAPI key: ${asBold(mask(key))} (from ${source})`)
    process.exit(0)
  })

function mask(key: string): string {
  return key.length > 12 ? `${key.slice(0, 8)}…${key.slice(-4)}` : '…'
}
