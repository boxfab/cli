# Changelog

Upstream changes are in `CHANGELOG-E2B.md`.

## 0.1.0-alpha.4 (2026-11-13)

- One `LICENSE` file: the MIT text with the upstream copyright line (FOUNDRYLABS, INC.) and
  ContextFab's; `LICENSE-E2B` is merged into it.
- README: "Under the hood" section (Firecracker, the E2B open-source infrastructure and CLI, and how
  to use the E2B CLI and SDKs with BoxFab, with the versions tested); the License section names
  the upstream CLI.
- No code changes from the previous release.

## 0.1.0-alpha.3 (2026-11-04)

- The CLI now bundles the BoxFab JS SDK (`boxfab` 0.1.0-alpha.2 on npm, built from the same
  `e2b` 2.61.0 release) instead of `e2b`. The SDK reads `BOXFAB_*` variables itself, so the
  `BOXFAB_*` -> `E2B_*` mapping is gone; the CLI's own variables (`BOXFAB_PROJECT_ID`,
  `BOXFAB_DOCS_BASE`, `BOXFAB_DASHBOARD_BASE`) are read directly. Inherited `E2B_*` variables are
  still ignored. User agent: `boxfab-js-sdk/... boxfab-cli/...`.
- `template init` for TypeScript generates `import ... from 'boxfab'` and a README with
  `npm install boxfab` and only `BOXFAB_API_KEY` (no `E2B_DOMAIN` needed); `template init` /
  `template migrate` hints say `npm install boxfab` / `pip install boxfab`.
- `template create` prints its Python example with `from boxfab import` (was `from e2b import`).
- The build checks the bundle instead of patching SDK messages: it fails if the bundle reads an
  `E2B_*` configuration variable, links to e2b.dev or e2b.app, or lacks the boxfab SDK.

## 0.1.0-alpha.2 (2026-11-03)

- First release published by the GitHub Actions workflow (npm trusted publishing, with
  provenance). No code changes from 0.1.0-alpha.1.

## 0.1.0-alpha.1 (2026-11-03)

- First alpha, generated from `@e2b/cli` 2.23.0 (commit `a91e33a3014a`), see `UPSTREAM.md`.
- Package `@boxfab/cli`, command `boxfab`; default domain `boxfab.io`.
- Configuration only through `BOXFAB_*` environment variables; inherited `E2B_*` variables are
  removed at start.
- `boxfab auth login` takes a team API key (prompt or `--api-key`) and stores it in
  `~/.boxfab/config.json`; browser sign-in and `auth configure` are removed.
- Sandbox links open `https://dashboard.boxfab.io/sandboxes/<id>`; documentation links point to
  `https://boxfab.dev/docs`.
- `template init` generates Python code for the `boxfab` Python SDK and `boxfab:build:*` targets.
