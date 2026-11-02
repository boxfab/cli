// Runs in every test worker before the tests: tests that use the bundled `e2b` SDK directly
// (not through the CLI) get the same BOXFAB_* -> E2B_* mapping as the CLI, so they talk to
// BoxFab and never to E2B's service.
import { applyBoxfabEnv } from '../src/boxfab-env'

applyBoxfabEnv()
if (/(^|\.)e2b\.(app|dev)$/.test(process.env.BOXFAB_DOMAIN ?? '')) {
  throw new Error(`refusing to run tests against ${process.env.BOXFAB_DOMAIN}`)
}
