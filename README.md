# BoxFab CLI

Command-line interface for [BoxFab](https://boxfab.dev): start sandboxes, open a terminal in
them, run commands, and manage sandbox templates.

> **Alpha.** Commands and output may still change between releases.

## Install

Node.js 22.19 or newer.

```bash
npm install -g @boxfab/cli
boxfab --version
```

## Log in

Get an API key from the [BoxFab dashboard](https://dashboard.boxfab.io) or your BoxFab
administrator, then:

```bash
boxfab auth login          # prompts for the key and stores it in ~/.boxfab/config.json
boxfab auth info           # shows the domain and which key is in use
boxfab auth logout
```

In CI or scripts, set `BOXFAB_API_KEY` instead; it takes precedence over the stored key.

## Sandboxes

```bash
boxfab sandbox create                          # terminal in a new sandbox from the `base` template
boxfab sandbox create code-interpreter-v1      # Python with Jupyter
boxfab sandbox create base -d --timeout 3600   # start without a terminal; prints the sandbox ID
boxfab sandbox list
boxfab sandbox connect <sandboxID>             # terminal in a running sandbox
boxfab sandbox exec <sandboxID> -- python3 -c 'print(6*7)'
boxfab sandbox pause <sandboxID>
boxfab sandbox resume <sandboxID>
boxfab sandbox kill <sandboxID>
```

`boxfab sandbox create` prints a link that opens the sandbox in the dashboard. `sbx` is short for
`sandbox`, `tpl` for `template`. Run any command with `--help` for all options.

## Templates

```bash
boxfab template list
boxfab template init                 # scaffold a template definition (Python or TypeScript)
boxfab template create <name>        # build a template from a Dockerfile
boxfab template delete <template>
```

Generated templates use the BoxFab SDKs: Python (`pip install boxfab`,
[PyPI](https://pypi.org/project/boxfab/)) and TypeScript (`npm install boxfab`,
[npm](https://www.npmjs.com/package/boxfab)). Both read `BOXFAB_API_KEY` and default to `boxfab.io`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `BOXFAB_API_KEY` | key from `boxfab auth login` | API key |
| `BOXFAB_DOMAIN` | `boxfab.io` | BoxFab domain (for a self-hosted or staging deployment) |
| `BOXFAB_DEBUG` | | `true` prints request details |
| `NO_UPDATE_NOTIFIER` | | set to skip the new-version check |

Only `BOXFAB_*` variables are read.

## Documentation

[boxfab.dev/docs](https://boxfab.dev/docs)

## Under the hood

BoxFab sandboxes are [Firecracker](https://firecracker-microvm.github.io/) microVMs, run on the
open-source [E2B](https://github.com/e2b-dev/infra) sandbox infrastructure. This CLI is derived from
the open-source E2B CLI; [UPSTREAM.md](UPSTREAM.md) lists every change.

**Using the E2B SDKs and CLI.** BoxFab serves the same API, so the E2B SDKs and CLI work with it
as well. Set both variables, the domain first:

```bash
export E2B_DOMAIN=boxfab.io
export E2B_API_KEY="<your BoxFab API key>"
```

Without `E2B_DOMAIN`, the E2B tools send requests, including the key, to E2B's own service. The E2B
CLI's `e2b auth login` signs in to E2B's service; with BoxFab, use `E2B_API_KEY` instead.

Tested against BoxFab with `e2b` 2.62.0 (Python), `e2b` 2.61.0 (JavaScript) and `@e2b/cli` 2.23.0.

## License

MIT, as the E2B CLI it is derived from; see [LICENSE](LICENSE).

BoxFab is a product of ContextFab, Inc.
