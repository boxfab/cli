import * as commander from 'commander'

import { asPrimary } from 'src/utils/format'
import { templateCommand } from './template'
import { sandboxCommand } from './sandbox'
import { authCommand } from './auth'

export const program = new commander.Command()
  // Fixed so help reads `e2b` however the entrypoint is invoked (npm bin
  // symlink, `node dist/index.js`, or a distro wrapper script).
  .name('boxfab')
  .enablePositionalOptions()
  .description(
    `Create sandbox templates from Dockerfiles by running ${asPrimary(
      'boxfab template create'
    )} then use our SDKs to create sandboxes from these templates.

Visit ${asPrimary(
      'BoxFab docs (https://boxfab.dev/docs)'
    )} to learn how to create sandbox templates and start sandboxes.
`
  )
  .addCommand(authCommand)
  .addCommand(templateCommand)
  .addCommand(sandboxCommand)
