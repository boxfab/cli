import * as commander from 'commander'

import { loginCommand } from './login'
import { logoutCommand } from './logout'
import { infoCommand } from './info'

// BoxFab authenticates with team API keys only: no browser sign-in, no project switching.
export const authCommand = new commander.Command('auth')
  .description('authentication commands')
  .addCommand(loginCommand)
  .addCommand(logoutCommand)
  .addCommand(infoCommand)
