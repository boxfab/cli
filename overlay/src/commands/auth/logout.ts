import * as commander from 'commander'
import * as fs from 'fs'

import { USER_CONFIG_PATH } from 'src/user'

export const logoutCommand = new commander.Command('logout')
  .description('log out of the CLI (removes the stored API key)')
  .action(async () => {
    if (!fs.existsSync(USER_CONFIG_PATH)) {
      console.log('Not logged in, nothing to do')
      return
    }
    fs.unlinkSync(USER_CONFIG_PATH)
    console.log('Logged out.')
  })
