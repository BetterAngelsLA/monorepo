# shelter-e2e

Playwright end-to-end tests for `shelter-web`, run against the local dev server
or any deployed environment (branch preview, DEV).

## Running locally

**Prerequisites** (dev container):

- The container image ships Chromium's system libraries (see the Playwright block
  in the root `Dockerfile`).
- Browser binaries are downloaded automatically at container creation
  (`tools/scripts/post-create.sh`). On an older container, rebuild it — or just run
  `yarn playwright install chromium` once.
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
  (`vite` in `apps/shelter-web`) and tears it down at the end, reusing one that
  is already listening. Specs therefore run against a dev build, not a
  production bundle — good enough for these smoke checks and no rebuild per run.
- Because the server is started in the environment the tests run in, the suite
  works from the dev container or from a host checkout: `localhost:8083` is
  correct in both. A container run gets a container server, a host run gets a
  host server.
- That server command must stay a plain `vite` invocation. Handing over an
  `nx run shelter-web:serve` string makes the `@nx/playwright` plugin turn it
  into a serve dependency plus a `--wait-for-webserver` gate, and the server that
  dependency starts under Nx exits immediately — the gate then polls a dead port
  until it times out. Plain `vite` gives the plugin nothing to infer, so
  Playwright owns the process.
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
  - `pages/home/map.spec.ts`: the map as mounted on home — that it renders, and
    that "Search this area" is revealed only after the map is moved (that last
    one is marked `test.fail` — see the file). The map's own behaviour belongs
    with the component in the lib.
  - `pages/home/shelter-search.spec.ts`: the search entry (which opens
    `/search`), plus the results count/source line and the deployed-only empty
    state.
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
- The exact empty-results copy ("0 of 0 locations" / "No results" / "Try
  searching for something else.") depends on the environment's data, so it is
  only asserted against deployed environments (`BASE_URL`, e.g. a PR preview).

## Troubleshooting

| Symptom                                                                       | Fix                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error while loading shared libraries: libgbm.so.1` (or similar)              | Container predates the Playwright Dockerfile block — Rerun "Dev Containers: Rebuild Container".                                                                          |
| `Executable doesn't exist...` for the browser                                 | `yarn playwright install chromium`.                                                                                                                                      |
| Chromium sandbox errors in the container                                      | Fallback: add `--no-sandbox` (or `chromiumSandbox: false`) — container-only; prefer fixing the container instead.                                                        |
| Firefox/WebKit runs fail                                                      | They are not provisioned locally yet (other suites list them in their configs). Use CI for cross-browser runs, or add their image deps + binaries using the same recipe. |
| `Timed out waiting 60000ms from config.webServer`                             | The dev server didn't come up. Run `yarn shelter` on its own to see its error — usually a port clash or a missing `apps/shelter-web/.env.local`.                         |
| Page shows "The server is configured with a public base URL of /branches/..." | A deployed `BASE_URL` missed the branch-scoped base path — include the full `/branches/<branch>/` segment.                                                               |

## CI (future)

Same specs are designed to run per-PR against the branch preview, GitHub-hosted:

1. checkout + `setup-node` (22.21.1, yarn cache) + `yarn install`
2. `yarn playwright install --with-deps chromium` (runners have sudo; this also
   installs the system libraries there)
3. run `shelter-e2e:e2e` with `BASE_URL` pointed at the preview deploy
4. post results as a PR comment
