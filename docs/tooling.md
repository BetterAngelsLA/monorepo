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

## Preview pipeline (PRs)

Two checks, split by what should block a merge:

- **`BuildTestDeploy (preview)`** — checks only: `lint typecheck test build`. No
  deploy, no EAS. `main` and `merge_group` still deploy from this workflow.
- **`Preview`** — one job: web deploy **and** the EAS update in parallel, then the
  Playwright suites, then the mobile build. Not a required check: it only runs on
  `pull_request`, and a required check that never reports on `merge_group`
  deadlocks the merge queue.

### Platforms

`EAS_BUILD_PLATFORMS` is decided per run in the `Set Environment Variables` step:
android always (the installable artifact), ios only when the change can affect
the native binary — `package.json`, `yarn.lock`, `apps/betterangels/{app.config.js,
app.json,eas.json,package.json}` or `ios/`/`android/`. A JS-only change reaches
devices through the EAS Update, so an ios build would buy nothing.

### Labels

| Label | Effect |
|---|---|
| `force-eas-build` | build even though a build exists for the fingerprint (the way out when a failed build poisoned it) |
| `preview-platforms` | force `android,ios` regardless of the change |
| `force-eas-env-sync` | re-push the EAS environment even when every variable is present (secret rotation) |

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
