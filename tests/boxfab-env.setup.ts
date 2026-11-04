// Runs in every test worker before the tests: tests that use the bundled `boxfab` SDK directly
// (not through the CLI) get the same BOXFAB_DOMAIN default as the CLI, and the suite refuses to
// run against E2B's service.
import { applyBoxfabEnv } from '../src/boxfab-env'

applyBoxfabEnv()
if (/(^|\.)e2b\.(app|dev)$/.test(process.env.BOXFAB_DOMAIN ?? '')) {
  throw new Error(`refusing to run tests against ${process.env.BOXFAB_DOMAIN}`)
}
