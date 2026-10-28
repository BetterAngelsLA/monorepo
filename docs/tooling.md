# Tooling & Commands

## Key Commands

```bash
# Backend (via NX)
yarn nx test betterangels-backend
yarn nx run betterangels-backend:typecheck
yarn nx run betterangels-backend:lint
yarn nx start betterangels-backend

# Backend (via uv)
uv sync                          # install/sync Python dependencies
uv run python script.py          # run a script within the venv
uv run pytest                    # run Django tests (serial, settings_test)
uv run pytest -n logical         # parallel, one test DB per worker
uv run pytest --reuse-db         # skip DB setup (default), add --create-db to rebuild

# Frontend (Expo)
yarn nx test betterangels
yarn nx start betterangels

# Frontend (Admin)
yarn nx test betterangels-admin
yarn nx start betterangels-admin

# Shelter Web
yarn nx test shelter-web

# Shelter E2E (Playwright) — see apps/shelter-e2e/README.md
yarn nx run shelter-e2e:e2e
```

### Test file naming

Repo convention (the runners accept both patterns — this is about consistency):

- E2E specs: `*.spec.ts` — what `shelter-e2e` collects (see
  [`apps/shelter-e2e/README.md`](../apps/shelter-e2e/README.md)).
- Unit tests: prefer `*.test.ts` / `*.test.tsx`. The runners collect both
  patterns and the codebase already has more `*.spec.tsx` files than
  `*.test.tsx`, so this is a preference for new files, not a renaming backlog.

## App environment

Two inputs, no third store:

- **`apps/betterangels/eas.json`** — the non-secret per-profile values (API and
  shelter URLs, `APP_VARIANT`, log level). Committed.
- **GitHub Actions** — the `EXPO_PUBLIC_*` secrets, already in the `env:` of the
  steps that build or publish.

`tools/scripts/write-eas-env.mjs` merges both into the **tracked**
`apps/betterangels/.env` before anything resolves app config. That file is the
only one that travels: `eas build` uploads the git tree, so an untracked
`.env.local` never reaches the builder. Locally, `.env.local` is the developer
override and dotenv applies it last.

The runtime version is the Expo fingerprint of `app.config.js`, so a value that
reaches `expoConfig` must be identical on both sides — a mismatch fails the
build's `CONFIGURE_EXPO_UPDATES` phase. `EXPO_PUBLIC_*` are inlined when the
bundle is built, so a value missing from `.env` ships `undefined` with nothing at
runtime to notice.

On a GitHub runner the file is **not** what `export-web` sees. Nx builds a
task's environment from dotenv files before its dependencies run, so
`write-eas-env` — a dependency of `export-web`, and the thing that writes the
file — arrives too late to influence it through the file alone. The same script
therefore also prints the profile as `export` lines (`--print`), and the workflow
evals those into the shell first; Nx never overrides a variable that is already
set. Both paths come from one resolver, so they cannot disagree. Change the
extra keys in one place: `eas.json` per profile, GitHub secrets for the rest.

## Preview pipeline (PRs)

Two checks, split by what should block a merge:

- **`BuildTestDeploy (preview)`** — checks only: `lint typecheck test build`. No
  deploy, no EAS. `main` and `merge_group` still deploy from this workflow.
- **`Preview`** — one job: the EAS update, then the web deploy, then the
  Playwright suites, then the mobile build. Not a required check: it only runs on
  `pull_request`, and a required check that never reports on `merge_group`
  deadlocks the merge queue.

### Platforms

Both device platforms are built — android, ios — plus the iOS simulator binary
that Maestro drives. Which ones actually queue is decided per fingerprint by
`tools/scripts/eas-builds.ts`: a fingerprint builds once, so a platform that
already has a live build for it is reused, and only a missing one is queued. A
build that ended `ERRORED` or `CANCELED` is not silently reused — it fails the
step, because that fingerprint has no binary and a green run would hide it.
Nothing is skipped for being a JS-only change: an EAS Update is useless without
a binary of the same runtime to run it, and a fingerprint that only ever saw JS
changes would never get one.

### Labels

| Label             | Effect                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `force-eas-build` | build even though a build exists for the fingerprint (the way out when a failed build poisoned it) |

### E2E suites

Both E2E steps run `nx run-many -t e2e --projects=tag:ci-e2e`. A Playwright
project joins CI by carrying the `ci-e2e` tag; it names no project in the
workflow. Each suite's `playwright.config.ts` resolves its own target through
[`tools/shared/e2e-base-url.mjs`](../tools/shared/e2e-base-url.mjs): `BASE_URL`,
else the branch preview this run deployed, else its own dev server.

## CI test database cache

The backend CI job restores a PostgreSQL dump instead of replaying the migration chain for every worker.

`prepare-test-db` is intentionally **not** Nx-cacheable and has no Nx `inputs`. It runs on every affected backend test invocation:

1. restore `.cache/test-db.dump` and `.cache/test-db.manifest.json`;
2. restore the dump into a scratch database;
3. verify the dump's applied migrations match the manifest;
4. run `manage.py migrate`;
5. run `manage.py flush --noinput`;
6. let `post_migrate` reseed the empty database;
7. validate, dump, and rewrite the manifest.

The manifest records only applied migration hashes. It detects edited, removed, or replaced migrations and falls back to the parallel full build; new migrations are applied on top of the restored dump.

### Expected logs and timings

Refresh path:

```text
test DB cache: restoring the previous dump
test DB migration state is current (...)
test DB cache: refreshed the previous dump
```

A refresh is roughly 12–16 s. A full rebuild is roughly 55–70 s and logs:

```text
test DB cache: building with 4 parallel migrations
test DB cache: built .../.cache/test-db.dump
```

### Force a rebuild

Locally, delete `.cache/test-db.dump` and `.cache/test-db.manifest.json` and rerun `yarn nx run betterangels-backend:prepare-test-db`.

For CI, bump `MANIFEST_VERSION` in `apps/betterangels-backend/scripts/test_db_cache_manifest.py` so the restored manifest is rejected. Purging the Actions cache also works but affects all CI caches.

### Seed and data-migration rule

The dump is schema plus `post_migrate` seed data. Because every refresh flushes data, a `RunPython` data migration that creates required rows must recreate those rows through `post_migrate` (or a cache reset plus a documented exception). Backfills that only operate on existing production data are safe: they are no-ops on the empty test database.

### Monorepo image

The monorepo Dockerfile lives at `tools/monorepo-image/Dockerfile` and is owned by the `monorepo-image` Nx project. Local image targets:

```bash
yarn nx run monorepo-image:image:ci-base
yarn nx run monorepo-image:image:production
```
