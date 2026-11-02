import { SANDBOX_INSPECT_URL } from 'src/user'
import { asPrimary } from './format'

/**
 * Prints a clickable URL to the BoxFab Dashboard for inspecting a sandbox
 *
 * This function creates a terminal-clickable link that allows users to
 * inspect their sandbox in the BoxFab Dashboard. The link is formatted with
 * ANSI escape sequences to make it clickable in compatible terminals.
 *
 * @param {string} sandboxId - The ID of the sandbox to inspect
 */
export const printDashboardSandboxInspectUrl = (sandboxId: string) => {
  const url = SANDBOX_INSPECT_URL(sandboxId)
  const clickable = `\u001b]8;;${url}\u0007${url}\u001b]8;;\u0007`

  console.log('')
  console.log(
    'Use the following link to inspect this Sandbox live inside the BoxFab Dashboard️:'
  )
  console.log(asPrimary(`↪ ${clickable}`))
  console.log('')
}
