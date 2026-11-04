#!/usr/bin/env python3
"""Regenerate src/, tests/ and the build configs from an upstream E2B CLI release.

    python scripts/sync_upstream.py                    # clone the pinned tag below
    python scripts/sync_upstream.py --src <checkout>   # use an existing E2B monorepo checkout

The output is fully derived: never hand-edit src/ or tests/; change a rule here or a file in
overlay/ instead and re-run. Every rule asserts how often it matched, so when upstream moves code
around the sync fails loudly instead of silently shipping an E2B default.

What happens (see UPSTREAM.md for the reasoning):
  1. packages/cli at the pinned commit is copied; LICENSE -> LICENSE-E2B, CHANGELOG -> CHANGELOG-E2B.md
  2. the browser (OAuth) sign-in and project switching are removed; overlay/ adds API-key auth,
     the BoxFab user config (~/.boxfab) and the BOXFAB_DOMAIN default (src/boxfab-env.ts)
  3. user-facing names, links and generated code are rewritten to BoxFab
  4. the `e2b` JS SDK is replaced by the `boxfab` JS SDK (the same SDK release, rebranded, reading
     BOXFAB_* variables), and the CLI's own E2B_* variables become BOXFAB_*
  5. monorepo-only paths (workspace SDK source, pnpm) are replaced by the published packages
The wire protocol and identifiers such as TemplateClass are unchanged.
"""

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UPSTREAM_REPO = "https://github.com/e2b-dev/E2B.git"
UPSTREAM_TAG = "@e2b/cli@2.23.0"
UPSTREAM_COMMIT = "a91e33a3014a7644a2d39e03501d25b21ad727c0"
CLI_SUBDIR = "packages/cli"

DOCS = "https://boxfab.dev/docs"
DASHBOARD = "https://dashboard.boxfab.io"

COPY = ["src", "tests", "tsconfig.json", "tsdown.config.ts", "vitest.config.ts"]
RENAME = {"LICENSE": "LICENSE-E2B", "CHANGELOG.md": "CHANGELOG-E2B.md"}
# Upstream files replaced by nothing: OAuth sign-in, token refresh, project switching, and the
# tests of the OAuth config format.
DELETE = [
    "src/commands/auth/configure.ts",
    "src/utils/token-refresh.ts",
    "tests/user_config_migration.test.ts",
    "tests/user_config_permissions.test.ts",
]

# (file, old, new, expected count)
EXACT = [
    # The environment mapping must run before any module reads process.env.
    (
        "src/index.ts",
        "#!/usr/bin/env -S node --enable-source-maps\n\n",
        "#!/usr/bin/env -S node --enable-source-maps\n\n"
        "// BoxFab: must stay the first import (see boxfab-env.ts).\nimport './boxfab-env'\n",
        1,
    ),
    ("src/index.ts", "'display E2B CLI version'", "'display BoxFab CLI version'", 1),
    ("src/commands/index.ts", ".name('e2b')", ".name('boxfab')", 1),
    ("src/commands/index.ts", "'E2B docs (https://e2b.dev/docs)'", f"'BoxFab docs ({DOCS})'", 1),
    ("src/api.ts", "setIntegration(`e2b-cli/", "setIntegration(`boxfab-cli/", 1),
    ("src/api.ts", "'https://e2b.dev/dashboard?tab=keys'", f"'{DASHBOARD}'", 1),
    ("src/api.ts", "asBold(\n    'E2B_API_KEY'\n  )", "asBold(\n    'BOXFAB_API_KEY'\n  )", 1),
    (
        "src/api.ts",
        "Visit ${asPrimary(",
        "Get one from your BoxFab administrator or ${asPrimary(",
        1,
    ),
    (
        "src/api.ts",
        ")} to get the API key.`",
        ")}.`",
        1,
    ),
    # No OAuth identity in the BoxFab config.
    (
        "src/utils/format.ts",
        "  const email = asBold(config.identity.email)\n"
        "  const project = config.projectName\n"
        "    ? asBold(config.projectName)\n"
        "    : asRed('Log out and log in to get project name')\n"
        "  const projectId = asBold(config.projectId)\n"
        "  return `You are logged in as ${email},\\nSelected project: ${project} (${projectId})`\n",
        "  return `Logged in with API key ${asBold(config.projectApiKey.slice(0, 8))}…`\n",
        1,
    ),
    ("src/commands/template/init.ts", "'echo Hello World E2B!'", "'echo Hello World BoxFab!'", 1),
    # Monorepo -> published packages.
    (
        "tsconfig.json",
        ',\n      "e2b": ["../js-sdk/src"],\n      "@e2b/dockerfile-utils": ["../dockerfile-utils-js/src"]',
        "",
        1,
    ),
    (
        "vitest.config.ts",
        "      // Mirror the `e2b` path in tsconfig.json, which is what tsc and the bundle\n"
        "      // already resolve to. Without it `e2b` resolves to the workspace package's\n"
        "      // `main`, which only exists once the SDK has been built.\n"
        "      e2b: path.resolve(__dirname, '../js-sdk/src'),\n"
        "      '@e2b/dockerfile-utils': path.resolve(\n"
        "        __dirname,\n"
        "        '../dockerfile-utils-js/src/index.ts'\n"
        "      ),\n",
        "",
        1,
    ),
    (
        "tsdown.config.ts",
        "  // Bundle from source rather than dist: during a release `changeset publish`\n"
        "  // rebuilds workspace packages concurrently, and their `clean` wipes dist.\n"
        "  alias: {\n"
        "    '@e2b/dockerfile-utils': fileURLToPath(\n"
        "      new URL('../dockerfile-utils-js/src/index.ts', import.meta.url)\n"
        "    ),\n"
        "  },\n",
        "",
        1,
    ),
    ("tsdown.config.ts", "import { fileURLToPath } from 'node:url'\n", "", 1),
    ("tests/setup.ts", "execSync('pnpm build'", "execSync('npm run build'", 1),
    # Tests that call the SDK in-process get the BoxFab environment mapping too.
    ("vitest.config.ts", "    globalSetup: ['tests/setup.ts'],\n", "    globalSetup: ['tests/setup.ts'],\n    setupFiles: ['tests/boxfab-env.setup.ts'],\n", 1),
    # Type-checking against the published SDK's declarations instead of the monorepo source:
    # a catch value must be narrowed to string, and the generated-code fixtures (which name SDK
    # types the declarations don't export) are not part of the CLI build.
    (
        "src/commands/template/init.ts",
        "return err instanceof Error ? err.message : err\n",
        "return err instanceof Error ? err.message : String(err)\n",
        1,
    ),
    ("tsconfig.json", '"exclude": ["dist", "node_modules"]', '"exclude": ["dist", "node_modules", "tests/**/fixtures"]', 1),
    ("src/api.ts", " * 3. ~/.e2b/config.json projectId", " * 3. ~/.boxfab/config.json projectId", 1),
]

# (glob under the output tree, pattern, replacement, expected total count)
REGEX = [
    # Command names in help texts and messages.
    ("src/**/*.ts", r"\be2b (auth|sandbox|template)\b", r"boxfab \1", 7),
    ("src/**/*.ts", r"\be2b(:build:(?:dev|prod))", r"boxfab\1", 14),
    ("src/**/*.ts", r"so e2b options", "so boxfab options", 1),
    ("src/**/*.ts", r"`e2b \$\{", "`boxfab ${", 2),
    # Product name in prose (identifiers such as E2BRequestError have no space and are untouched).
    ("src/**/*.ts", r"\bE2B (Dashboard|dashboard|config|tries|API)\b", r"BoxFab \1", 8),
    # Internal names that surface in error output (error class name, stack frames).
    ("src/**/*.ts", r"\b(\w*)E2B(RequestError|ResponseError|Response|Config)\b", r"\1BoxFab\2", 28),
    ("tests/**/*.ts", r"\b(\w*)E2B(RequestError|ResponseError|Response|Config)\b", r"\1BoxFab\2", None),
    # Links.
    ("src/**/*.ts", r"https://e2b\.dev/docs", DOCS, 4),
    ("src/**/*.ts", r"\(https://e2b\.dev/dashboard[^)\s'`]*\)", f"({DASHBOARD})", 1),
    # Generated Python code uses the BoxFab Python SDK.
    ("src/templates/python-*.hbs", r"\bfrom e2b import\b", "from boxfab import", 3),
    # The CLI and its generated TypeScript code use the BoxFab JS SDK (`boxfab` on npm).
    ("src/**/*.ts", r"from 'e2b'", "from 'boxfab'", 28),
    # The Python example `template create` prints on success.
    ("src/**/*.ts", r"`from e2b import\b", "`from boxfab import", 1),
    ("src/templates/typescript-*.hbs", r"from 'e2b'", "from 'boxfab'", 2),
    ("src/commands/template/*.ts", r"\b(npm|pip) install e2b\b", r"\1 install boxfab", 4),
    ("src/commands/template/*.ts", r"\(install e2b dependency\)", "(install boxfab dependency)", 4),
    # The CLI's own environment variables (the SDK reads BOXFAB_* itself).
    ("src/**/*.ts", r"\bE2B_(API_KEY|PROJECT_ID|TEAM_ID|DOCS_BASE|DASHBOARD_BASE|DOMAIN|ACCESS_TOKEN|API_URL|SANDBOX_URL|DEBUG)\b", r"BOXFAB_\1", 8),
    # Tests: the same rewrites, and the CLI reads only BOXFAB_* variables.
    ("tests/**/*.ts", r"\be2b (auth|sandbox|template)\b", r"boxfab \1", None),
    ("tests/**/*.py", r"\bfrom e2b import\b", "from boxfab import", None),
    ("tests/**/*.ts", r"\be2b(:build:(?:dev|prod))", r"boxfab\1", None),
    ("tests/**/*.ts", r"(['`])from e2b import\b", r"\1from boxfab import", None),
    ("tests/**/*.ts", r"\be2b-cli/", "boxfab-cli/", None),
    ("tests/**/*.ts", r"\be2b-js-sdk\\?/", lambda m: m.group(0).replace("e2b", "boxfab"), None),
    ("tests/**/*.ts", r"'e2b\.app'", "'boxfab.io'", 4),
    ("tests/**/*.ts", r"\bE2B_(API_KEY|DOMAIN|DEBUG|ACCESS_TOKEN|API_URL|SANDBOX_URL|PROJECT_ID|TEAM_ID)\b", r"BOXFAB_\1", None),
    ("tests/**/*.ts", r"from 'e2b'", "from 'boxfab'", None),
    # Module mocks and dynamic imports must name the module the CLI now imports.
    ("tests/**/*.ts", r"\b(vi\.mock|import|vi\.importActual)\('e2b'", r"\1('boxfab'", 7),
    ("tests/**/*.ts", r"(npm|pip) install e2b\b", r"\1 install boxfab", None),
    ("tests/**/*.ts", r"\(install e2b dependency\)", "(install boxfab dependency)", None),
]

# What may remain in src/ after the rewrites, anything else matching FORBIDDEN fails the sync.
FORBIDDEN = re.compile(
    r"e2b\.dev|e2b\.app|\.e2b['/]|E2B_API_KEY'|'e2b auth|`e2b |\be2b sandbox\b"
    r"|from 'e2b'|\bfrom e2b import\b|\bprocess\.env\.E2B_|(npm|pip) install e2b\b"
)


def sh(*args, cwd=None):
    subprocess.run(args, cwd=cwd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, help="existing E2B monorepo checkout at the pinned commit")
    a = ap.parse_args()

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        src = a.src
        if src is None:
            src = Path(tmp) / "E2B"
            sh("git", "clone", "-q", "--filter=blob:none", "--no-checkout", UPSTREAM_REPO, str(src))
            sh("git", "checkout", "-q", UPSTREAM_COMMIT, cwd=src)
        head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=src, capture_output=True, text=True).stdout.strip()
        if head != UPSTREAM_COMMIT:
            sys.exit(f"{src} is at {head}, expected {UPSTREAM_COMMIT} ({UPSTREAM_TAG})")
        cli = src / CLI_SUBDIR

        for name in COPY:
            dst = ROOT / name
            if dst.is_dir():
                shutil.rmtree(dst)
            elif dst.exists():
                dst.unlink()
            (shutil.copytree if (cli / name).is_dir() else shutil.copy2)(cli / name, dst)
        for old, new in RENAME.items():
            shutil.copy2(cli / old, ROOT / new)

    for rel in DELETE:
        p = ROOT / rel
        assert p.exists(), f"DELETE: {rel} not found upstream"
        p.unlink()

    overlay = ROOT / "overlay"
    for f in sorted(overlay.rglob("*")):
        if f.is_file():
            dst = ROOT / f.relative_to(overlay)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, dst)

    for rel, old, new, count in EXACT:
        p = ROOT / rel
        text = p.read_text()
        n = text.count(old)
        assert n == count, f"EXACT {rel}: {old[:60]!r} found {n}x, expected {count}"
        p.write_text(text.replace(old, new))

    for pattern, rx, repl, count in REGEX:
        total = 0
        for p in sorted(ROOT.glob(pattern)):
            if "overlay" in p.parts or not p.is_file():
                continue
            text = p.read_text()
            new_text, n = re.subn(rx, repl, text)
            if n:
                p.write_text(new_text)
                total += n
        if count is not None:
            assert total == count, f"REGEX {pattern} {rx!r}: {total} matches, expected {count}"
        print(f"  {total:3d}x {rx}  ({pattern})")

    leftovers = []
    for p in sorted((ROOT / "src").rglob("*")):
        if p.is_file():
            for i, line in enumerate(p.read_text().splitlines(), 1):
                if FORBIDDEN.search(line):
                    leftovers.append(f"{p.relative_to(ROOT)}:{i}: {line.strip()}")
    if leftovers:
        sys.exit("E2B references left in src/:\n" + "\n".join(leftovers))
    print(f"synced {UPSTREAM_TAG} ({UPSTREAM_COMMIT[:12]})")


if __name__ == "__main__":
    main()
