# shelter-e2e

Playwright end-to-end tests for `shelter-web`, run against the local dev server
or any deployed environment (branch preview, DEV).

## Running locally

**Prerequisites** (dev container):

- The image ships Chromium's system libraries (see the Playwright block in the
  root `Dockerfile`), so no `--with-deps` install is needed.
- The dev container builds the `development` stage, which also carries the
  browser binaries — it inherits the `playwright` stage, which installs from the
  same `yarn.lock` as `node_modules`. `tools/scripts/post-create.sh` still runs
  `yarn playwright install chromium`, which covers an older image and the
  `dev_home` volume that shadows the baked cache.
- Running the suite from a **host** checkout instead of the container works the
  same way, but needs its own install there: `yarn install` and
  `yarn playwright install chromium`.

**Commands:**

```bash
# All specs — starts the dev server (http://localhost:8083/) for the run,
# tearing down only the instance it started
yarn nx run shelter-e2e:e2e

# Optional: run your own dev server (HMR) instead — the test run reuses it
yarn shelter

# A single test by name
yarn playwright test -c apps/shelter-e2e -g "renders the form"

# List discovered tests without running them
yarn playwright test -c apps/shelter-e2e --list

# Against a deployed environment instead of local — pass the full URL
# (e.g. the preview link from the PR comment; trailing slash is normalized)
BASE_URL=https://shelter.dev.betterangels.la/branches/<branch>/ yarn nx run shelter-e2e:e2e
```

Notes:

- Runs are headless (the container has no display — `--headed`/`--ui` are not
  available here).
- Debugging: re-run with `--trace on` and open the HTML report from
  `dist/.playwright/apps/shelter-e2e/`.

## How it works

- Config: [`playwright.config.ts`](./playwright.config.ts).
- Default `baseURL` is `http://localhost:8083/` — the port comes from
  `server.port` in `apps/shelter-web/vite.config.mts`, and the dev server serves
  from the root locally (`tools/shared/get-base-path.mjs` branch-scopes only
  deployed builds, at `/branches/<branch>/`). The run starts that server itself
  (`nx run shelter-web:dev`) and lets Nx tear it down at the end, reusing one
  that is already listening. Specs therefore run against a dev build, not a
  production bundle — good enough for these smoke checks and no rebuild per run.
- Because the server is started in the environment the tests run in, the suite
  works from the dev container or from a host checkout: `localhost:8083` is
  correct in both. A container run gets a container server, a host run gets a
  host server.
- The server command is `npx nx run shelter-web:dev`, which is the form
  `@nx/playwright` recognises: Nx runs that target as a dependency and infers
  the `dev--wait-for-webserver` gate, so Playwright waits on the port Nx's own
  `vite` process serves. The target carries the port, so no arguments are passed
  and there is no separate `vite` binary path to keep in sync.
- Setting `BASE_URL` targets a deployed environment. It is used verbatim apart
  from the trailing slash, so provide the full URL including any
  `/branches/<branch>/` segment (e.g. the preview link from the PR comment). CI
  runs the specs this way.
- Specs navigate with paths **relative to the base URL** (e.g.
  `page.goto('sign-in')`) so the same specs work under any base path, including
  deployed previews served from `/branches/<branch>/`.
- Only a `chromium` project is configured. When adding firefox/webkit or mobile
  device profiles, remember those browsers also need their system libraries in
  the image and their binaries installed (`yarn playwright install firefox webkit`).

## Scope

Anonymous, client-side flows so far:

- Layout mirrors the mobile suite's `.maestro/` directory: `tests/` holds what
  the runner executes, `lib/` holds reusable pieces it never collects.
  `testDir: './tests'` scopes collection to that directory and
  `testMatch: '**/*.spec.ts'` narrows it to specs only — the default pattern
  would also collect a helper named `*.test.ts` or a stray `.spec.js`.
  Deliberately not the e2e generator's `src/`: the directory is what keeps
  shared code out of the run, and `project.json`'s `sourceRoot` points at
  `tests/` to match. Everything else about this project is generated shape —
  `projectType: "application"`, `tags: []` like `betterangels-admin-e2e`,
  `implicitDependencies: ["shelter-web"]`, and plugin-inferred targets.
- `lib/` stays a **sibling** of `tests/`, not a child of it. Outside `testDir`
  the runner cannot reach it structurally, which keeps `testMatch` a second
  guard instead of the only one. Nesting it would trade that for a shorter
  import path — not worth it.
- `tests/pages/<page>/` — one file per page feature:
  - `nav.spec.ts`, one per page, each with a describe per breakpoint band,
    calling the helpers in `lib/navigation/`: `pages/home/nav.spec.ts` (which
    also owns the flyout's interactions, since those are shell behaviour worth
    running once) and `pages/sign-in/nav.spec.ts` (composition only). A page
    whose header differs overrides the rule there rather than forking the
    helper.
  - `pages/home/map.spec.ts`: the map as mounted on home — that it renders and
    that its controls drive it. The map's own behaviour belongs with the
    component in the lib.
  - `pages/home/shelter-search.spec.ts`: the search entry (which opens
    `/search`) and the results count/source line.
  - `pages/sign-in/form.spec.ts`: sign-in form enable/disable logic.
- `lib/` is imported through `lib/index.ts` (e.g.
  `import { VIEWPORTS, assertInlineNav } from '../../../lib'`):
  `framework/constants.ts` holds `VIEWPORTS`;
  `navigation/constants.ts` (the link set both bands assert),
  `navigation/inline-nav.ts` (`assertInlineNav`) and
  `navigation/flyout-nav.ts` (`assertCollapsedNav`, `assertFlyoutNav`).

Specs must not create data or submit forms unless the flow explicitly requires it.

Environment notes for the home specs:

- The map needs `VITE_SHELTER_GOOGLE_MAPS_API_KEY`; the results panel talks to
  `VITE_SHELTER_API_URL` (see `apps/shelter-web/.env.local`). With the local
  backend not running the panel stays in its pre-search state — the specs
  tolerate both states.
- The results line depends on the environment's data — `0 locations` +
  `(based on search area)` before a search resolves, `N of M locations` +
  `(based on map area)` after — so the specs assert tolerant patterns rather
  than exact strings.
- Exact empty-state copy is not asserted anywhere. Whether a searched area holds
  public shelters is data, not code, and asserting it made the suite depend on
  what a given environment happens to contain; that belongs to a component test
  with a mocked response.

## Troubleshooting

| Symptom                                                                       | Fix                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error while loading shared libraries: libgbm.so.1` (or similar)              | Container predates the Playwright Dockerfile block — Rerun "Dev Containers: Rebuild Container".                                                                          |
| `Executable doesn't exist...` for the browser                                 | `yarn playwright install chromium`.                                                                                                                                      |
| Chromium sandbox errors in the container                                      | Fallback: add `--no-sandbox` (or `chromiumSandbox: false`) — container-only; prefer fixing the container instead.                                                        |
| Firefox/WebKit runs fail                                                      | They are not provisioned locally yet (other suites list them in their configs). Use CI for cross-browser runs, or add their image deps + binaries using the same recipe. |
| `Timed out waiting 60000ms from config.webServer`                             | The dev server didn't come up. Run `yarn shelter` on its own to see its error — usually a port clash or a missing `apps/shelter-web/.env.local`.                         |
| Page shows "The server is configured with a public base URL of /branches/..." | A deployed `BASE_URL` missed the branch-scoped base path — include the full `/branches/<branch>/` segment.                                                               |

## CI

Runs in the `🧪 E2E shelter-web (preview)` step of
[`.github/workflows/default.yml`](../../.github/workflows/default.yml), inside
the same monorepo container every other CI step uses — not a host runner with
`setup-node`, so nothing is installed at test time:

- **Browsers** are installed by the run itself
  (`yarn playwright install chromium` in `tools/scripts/e2e-shelter.sh`). CI
  builds the `production` stage, which carries the system libraries but not the
  binaries: that image is also the ECS task image, and the backend task never
  launches a browser. The install uses the same `yarn.lock` as `node_modules`,
  so the browser cannot drift from the installed Playwright.
- **The target is chosen by
  [`tools/scripts/e2e-shelter.sh`](../../tools/scripts/e2e-shelter.sh)**, the
  same script you can run locally: `shelter-web` affected means this branch's
  preview, a `shelter-e2e`-only change means that preview if it exists and a
  skip otherwise. It probes the served `<base href>` before running — a missing
  branch path returns 403, and the page has no `<base>` at all. The script
  exports `BASE_URL`, which is also what stops the suite starting its own dev
  server and testing a local build instead — which looks like a pass.
- **Order** is after `deploy`, which returns only once the edge serves the
  revision just built, so the run describes this commit rather than whatever was
  deployed before it.
- **Run through Playwright, not Nx**: the script calls
  `yarn playwright test -c apps/shelter-e2e`, so there is no Nx cache that could
  replay a run from before the deploy.

`nx affected -t e2e` is deliberately not used: `BASE_URL` is one value for the
whole container, so a second suite in the same invocation would be handed the
wrong origin.

The reporters are declared in `playwright.config.ts` — `list`, the preset's
`html`, and a `json` report written to `test-output/e2e-report.json` — because
Playwright's `--reporter` flag replaces the configured list rather than adding
to it. Declaring them in the config also keeps those paths inside the
`outputs` @nx/playwright infers for the target. The
`shelter-e2e-report-<branch>` artifact is the whole
`dist/.playwright/apps/shelter-e2e` directory, so it carries the HTML report,
the JSON report and traces. Posting the results as a PR comment is not wired
up yet.
