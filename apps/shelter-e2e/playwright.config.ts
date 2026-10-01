import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';
import { getBranchBasePath } from '../../tools/shared/get-base-path.mjs';

/**
 * URL of the locally served production build.
 *
 * `shelter-web:preview` (port from apps/shelter-web/vite.config.mts) builds
 * and serves under the same branch-scoped base path as deployed previews —
 * `/branches/<git-branch>/` (see tools/shared/get-base-path.mjs). Mirror that
 * here so local runs exercise the exact same URL shape.
 */
function localPreviewURL(): string {
  const basePath = getBranchBasePath();
  return `http://localhost:8183${
    basePath.endsWith('/') ? basePath : `${basePath}/`
  }`;
}

/**
 * Base URL of the app under test.
 *
 * Defaults to the locally served production build. Set `BASE_URL` to run the
 * same specs against a deployed environment — e.g. a branch preview:
 *
 *   BASE_URL=https://shelter.dev.betterangels.la/branches/<branch>/ \
 *     yarn nx run shelter-e2e:e2e
 */
const rawBaseURL = process.env['BASE_URL'] || localPreviewURL();

/**
 * Always end with `/` so relative navigation in specs (`page.goto('sign-in')`)
 * resolves correctly under any base path — including deployed previews that
 * are served under `/branches/<branch>/`.
 */
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;

/**
 * When `BASE_URL` targets a deployed environment, do not start a local server.
 * Otherwise, Playwright serves the production build locally.
 */
const webServer = process.env['BASE_URL']
  ? undefined
  : {
      command: 'yarn nx run shelter-web:preview',
      url: localPreviewURL(),
      reuseExistingServer: true,
      cwd: workspaceRoot,
    };

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Start the local preview server unless a deployed BASE_URL is used. */
  ...(webServer ? { webServer } : {}),
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
