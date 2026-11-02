# Releasing

npm is reached only through `.github/workflows/publish.yml`, which runs when a GitHub Release is
**published** (pre-releases included; saving a draft does nothing). Releases use npm trusted
publishing (OIDC): there is no npm token in the repository or its secrets.

## What protects a release

| Control | Where |
|---|---|
| tag must be `v<version in package.json>`; the tagged commit must be on `main` | `publish.yml` job `verify` + `scripts/check_release_tag.mjs` |
| full CI on the exact tagged commit; the tarball is built and checked there once | `publish.yml` job `ci` (calls `ci.yml`) |
| exact file list, name/version/license/bin, no local paths, API keys, private keys or (optional `DIST_EXTRA_DENY`) site-specific names; clean install runs; help text names BoxFab only; inherited `E2B_*` variables are ignored | `ci.yml` job `build` + `scripts/check_package.mjs` |
| that exact tarball is uploaded; only this job has `id-token: write`; provenance is attached | `publish.yml` job `publish` |
| a pre-release version (`0.1.0-alpha.1`) goes to the `alpha` dist-tag, never `latest` | `publish.yml` job `publish` |
| one publication at a time, never cancelled | `concurrency: npm-publish` |
| actions pinned to commit SHAs | workflow files |

## One-time setup (owner)

1. npmjs.com, organization `boxfab`: 2FA required for publishing.
2. Repository: environment `npm` (Settings → Environments); while the repository is private on
   GitHub Team, a required reviewer cannot be set, so publishing the GitHub Release is the human
   approval. Add rulesets like `boxfab/python-sdk` (`main` via pull requests with CI; `v*` tags
   created by admins only and immutable).
3. npm trusted publisher for `@boxfab/cli` (package → Settings → Trusted publishing → GitHub
   Actions): organization `boxfab`, repository `cli`, workflow `publish.yml`, environment `npm`.
   If npmjs.com only offers this for a package that already exists, do the first release by hand
   (below), then add the trusted publisher, and use the workflow from the next release on.
4. Optional: repository secret `DIST_EXTRA_DENY`, a regex of site-specific names the package
   check must reject.

## Release

1. Pull request: bump `version` in `package.json` (and `package-lock.json`: `npm install
   --package-lock-only`), add the `CHANGELOG.md` entry; merge after CI passes.
2. GitHub → Releases → *Draft a new release*: tag `v<version>` (*Create new tag on publish*),
   target `main`, tick *Set as a pre-release* for alpha/beta versions, then **Publish release**.
3. Watch the `Publish to npm` run; check https://www.npmjs.com/package/@boxfab/cli and
   `npm view @boxfab/cli dist-tags`.

### First release by hand (only if trusted publishing cannot be set up before the package exists)

Publish the tarball that CI built, not a local build:

```bash
gh run download <CI run id on the release commit> -R boxfab/cli -n package -D pkg
node scripts/check_package.mjs pkg/*.tgz
npm login                       # an account in the boxfab org, with 2FA
npm publish ./pkg/*.tgz --access public --tag alpha
```

(`--provenance` is only available from CI.)
