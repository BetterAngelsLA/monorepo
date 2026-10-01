# shelter-e2e

Playwright end-to-end tests for `shelter-web`, run against a local preview build
or any deployed environment (branch preview, DEV).

## Running locally

**Prerequisites** (dev container):

- The container image ships Chromium's system libraries (see the Playwright block
  in the root `Dockerfile`).
- Browser binaries are downloaded automatically at container creation
  (`tools/scripts/post-create.sh`). On an older container, rebuild it — or just run
  `yarn playwright install chromium` once.

**Commands:**

```bash
# All specs — builds and serves shelter-web automatically
yarn nx run shelter-e2e:e2e

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
- Default `baseURL` is `http://localhost:8183/branches/<git-branch>/` — the
  preview build is served under the same branch-scoped base path as deployed
  previews (see `tools/shared/get-base-path.mjs`), and the config derives it
  identically. The `webServer` entry (`yarn nx run shelter-web:preview`) builds
  and serves it. Setting `BASE_URL` targets a deployed environment and skips
  the local server entirely — it is used verbatim (only the trailing slash is
  normalized), so provide the full URL including any `/branches/<branch>/`
  segment (e.g. the preview link from the PR comment).
- Specs navigate with paths **relative to the base URL** (e.g.
  `page.goto('sign-in')`) so the same specs work under any base path, including
  deployed previews served from `/branches/<branch>/`.
- Only a `chromium` project is configured. When adding firefox/webkit or mobile
  device profiles, remember those browsers also need their system libraries in
  the image and their binaries installed (`yarn playwright install firefox webkit`).

## Scope

Anonymous, client-side flows so far:

- Home page smoke coverage (`src/home.spec.ts`), in two viewport sections:
  - desktop (1280x720): header nav, sign-in banner (+ dismiss), Google map
    render, search affordances, results panel patterns, header → sign-in
    navigation.
  - mobile (375x812): hamburger replaces the inline nav; flyout open/close
    (close button, mask tap, navigation) and its links.
- Sign-in form enable/disable logic (`src/sign-in.spec.ts`).

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

| Symptom                                                                       | Fix                                                                                                                                                                                |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error while loading shared libraries: libgbm.so.1` (or similar)              | Container predates the Playwright Dockerfile block — Rerun "Dev Containers: Rebuild Container".                                                                                    |
| `Executable doesn't exist...` for the browser                                 | `yarn playwright install chromium`.                                                                                                                                                |
| Chromium sandbox errors in the container                                      | Fallback: add `--no-sandbox` (or `chromiumSandbox: false`) — container-only; prefer fixing the container instead.                                                                  |
| Firefox/WebKit runs fail                                                      | They are not provisioned locally yet (other suites list them in their configs). Use CI for cross-browser runs, or add their image deps + binaries using the same recipe.           |
| Page shows "The server is configured with a public base URL of /branches/..." | The URL missed the branch-scoped base path — preview builds are served under `/branches/<git-branch>/` (config derives it automatically; a manual `BASE_URL` must include it too). |

## CI (future)

Same specs are designed to run per-PR against the branch preview, GitHub-hosted:

1. checkout + `setup-node` (22.21.1, yarn cache) + `yarn install`
2. `yarn playwright install --with-deps chromium` (runners have sudo; this also
   installs the system libraries there)
3. run `shelter-e2e:e2e` with `BASE_URL` pointed at the preview deploy
4. post results as a PR comment
