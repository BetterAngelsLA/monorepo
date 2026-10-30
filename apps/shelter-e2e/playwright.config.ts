import { resolve } from 'path';

import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

import { e2eBaseUrl } from '../../tools/shared/e2e-base-url.mjs';

/** The port is `server.port` in apps/shelter-web/vite.config.mts. */
const LOCAL_DEV_SERVER_URL = 'http://localhost:8083/';

/**
 * An explicit `BASE_URL` wins, else the preview this run deployed, else the
 * local dev server. Both URLs end with `/` so specs can navigate relatively.
 */
const previewBaseURL = e2eBaseUrl('shelter-web');
const baseURL = previewBaseURL ?? LOCAL_DEV_SERVER_URL;

/**
 * Started by the run itself unless a deployed URL is the target. `nx run
 * <project>:<target>` is the form @nx/playwright recognises: it supplies the
 * `e2e--wait-for-webserver` gate, and Nx starts the server in the same
 * environment as the browser, so `localhost` holds either way.
 */
const webServer = previewBaseURL
  ? undefined
  : {
      command: 'npx nx run shelter-web:dev',
      url: LOCAL_DEV_SERVER_URL,
      reuseExistingServer: true,
    };

/** The preset owns the output paths and the `html` reporter. */
const preset = nxE2EPreset(__filename, {
  testDir: './tests',
  openHtmlReport: process.env['CI'] ? 'never' : 'on-failure',
  generateBlobReports: false,
});

export default defineConfig({
  ...preset,
  /*
   * Declared here, never on the command line: `--reporter` replaces this list
   * instead of adding to it. Config-declared files also land inside the outputs
   * @nx/playwright infers, so the CI artifact carries them.
   */
  reporter: [
    ['list'],
    ...preset.reporter,
    [
      'json',
      { outputFile: resolve(__dirname, preset.outputDir, 'e2e-report.json') },
    ],
  ],
  /* Only `*.spec.ts` in `tests/` runs; the default also collects `*.test.ts`. */
  testMatch: '**/*.spec.ts',
  /* One retry in CI so `on-first-retry` has a trace to record; none locally. */
  retries: process.env['CI'] ? 1 : 0,
  /* Start the local dev server unless a preview (or BASE_URL) is the target. */
  ...(webServer ? { webServer } : {}),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Add browsers/profiles when needed: https://playwright.dev/docs/test-projects */
  ],
});
