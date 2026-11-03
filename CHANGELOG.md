# Changelog

Upstream changes are in `CHANGELOG-E2B.md`.

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
