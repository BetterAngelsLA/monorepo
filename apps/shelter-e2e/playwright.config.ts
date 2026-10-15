import { joinPathFragments, workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

/**
 * URL of the local dev server.
 *
 * The port comes from `server.port` in apps/shelter-web/vite.config.mts. The
 * dev server serves from the root locally — `tools/shared/get-base-path.mjs`
 * branch-scopes only deployed builds, at `/branches/<branch>/`.
 */
const LOCAL_DEV_SERVER_URL = 'http://localhost:8083/';

/**
 * Base URL of the app under test.
 *
 * Defaults to the local dev server. Set `BASE_URL` to run the same specs
 * against a deployed environment — DEV or a branch preview (what CI does):
 *
 *   BASE_URL=https://shelter.dev.betterangels.la/branches/<branch>/ \
 *     yarn nx run shelter-e2e:e2e
 */
const rawBaseURL = process.env['BASE_URL'] || LOCAL_DEV_SERVER_URL;

/**
 * Always end with `/` so relative navigation in specs (`page.goto('sign-in')`)
 * resolves correctly under any base path — including deployed previews that
 * are served under `/branches/<branch>/`.
 */
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;

/**
 * The local dev server, started by the run itself unless `BASE_URL` targets a
 * deployed environment. Starting it here keeps it in the same environment as
 * the browser — a container run gets a container server, a host run gets a host
 * server — so `localhost` is correct either way. An instance that is already
 * listening is reused.
 *
 * The command must NOT be an `nx run <project>:<target>` invocation. The
 * @nx/playwright plugin rewrites one into a serve dependency plus a
 * `<target>--wait-for-webserver` gate, and the server that dependency starts
 * under Nx exits immediately (Vite's CLI shuts down on stdin EOF/SIGTERM), so
 * the gate waits out its whole timeout against a dead port. A plain `vite`
 * command leaves the plugin nothing to infer, and Playwright owns the process.
 *
 * The binary is invoked by absolute path because `node_modules/.bin` is not on
 * PATH for a process Playwright spawns, and `yarn vite` cannot be used from the
 * project subdirectory (this repo is not a yarn workspace). `--strictPort`
 * makes a taken port fail loudly instead of Vite silently moving to the next
 * one while the tests keep polling 8083.
 */
const webServer = process.env['BASE_URL']
  ? undefined
  : {
      command: `${joinPathFragments(workspaceRoot, 'node_modules/.bin/vite')} --strictPort`,
      cwd: joinPathFragments(workspaceRoot, 'apps/shelter-web'),
      url: LOCAL_DEV_SERVER_URL,
      reuseExistingServer: !process.env['CI'],
    };

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './tests' }),
  /*
   * Only `*.spec.ts` inside `tests/` runs. Playwright's default also collects
   * `*.test.ts` and the compiled-suffix variants (`.spec.js`, `.spec.mts`, …),
   * so pinning it keeps a file's role decided by name and directory alone — and
   * @nx/playwright derives its per-file targets from this same pattern.
   */
  testMatch: '**/*.spec.ts',
  /*
   * One retry in CI, none locally, stated rather than inherited: the preset
   * defaults to two, and a deterministic failure then costs three runs of every
   * failing test before the run goes red. One still absorbs a transient blip
   * from the dev API or the maps API, and it is what makes `on-first-retry`
   * below produce a trace at all — with no retries there is no trace to read.
   */
  retries: process.env['CI'] ? 1 : 0,
  /* Start the local dev server unless a deployed BASE_URL is used. */
  ...(webServer ? { webServer } : {}),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /*
     * Add more browsers or mobile device profiles when needed:
     * https://playwright.dev/docs/test-projects
     * (apps/betterangels-admin-e2e runs chromium, firefox and webkit.)
     */
  ],
});
