# Notes for AI agents and reviewers

## Review guidelines

This repository republishes the open-source E2B CLI under the BoxFab name. Most of the code is
copied from upstream by `scripts/sync_upstream.py` and then changed by `overlay/` and a fixed set of
asserted rewrites (see `UPSTREAM.md`).

- **Generated paths are out of scope for behaviour review:** `src/` and `tests/` (apart from the
  files that come from `overlay/`), `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts` and
  `CHANGELOG-E2B.md`. Their logic is upstream's; bugs in it are not fixed here. Do not report them.
- **Do review:** the sync script and its rules (a rewrite that changes behaviour beyond a rename or
  the documented BoxFab changes, a rule that can match the wrong text, a check that can miss an
  upstream name or variable), `overlay/`, `scripts/`, `package.json`, the workflows in
  `.github/workflows/` (release safety, permissions, secrets, triggers, dist-tags) and the
  hand-written docs.
- Report concrete P1/P2 defects with the triggering input and effect; skip style.
