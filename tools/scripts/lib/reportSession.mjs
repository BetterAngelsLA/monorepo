/**
 * The shared Playwright bootstrap for the Reports-page verification scripts.
 *
 * All three scripts need the same thing before they can assert anything: Chrome, a context, the
 * session cookies, the Reports page, and a collector for page errors.
 *
 * The cookie injection is the part worth having exactly one copy of. The API sets
 * `Set-Cookie: sessionid=…` with **no `Domain` attribute**, so the cookie is host-only: a page
 * served from `localhost` cannot see a cookie issued for `127.0.0.1` and vice versa, and the
 * login POST then fails 403 "CSRF cookie not set". The cookie is pinned to `localhost` here
 * because that is what `BASE` defaults to; a different host means a different cookie jar.
 *
 * The caller owns the browser: wrap every assertion in `try/finally` and call
 * `browser.close()` in the `finally`, or a throwing check leaks a Chrome process.
 */
import { chromium } from 'playwright';

/** The branch preview, which is what the verification runs are pointed at by default. */
export const DEFAULT_BASE =
  'http://localhost:8090/branches/gis-regions-frontend';

/** `BASE` override, or the branch preview. One default for all three scripts. */
export function reportBaseUrl() {
  return process.env.BASE ?? DEFAULT_BASE;
}

/**
 * Launch Chrome, inject the session cookies, open `${BASE}/reports` and start collecting page
 * errors, which the caller reports alongside its own assertions.
 */
export async function openReports({
  viewport = { width: 1600, height: 1000 },
} = {}) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport });
  await context.addCookies([
    {
      name: 'sessionid',
      value: process.env.SESSION,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'csrftoken',
      value: process.env.CSRF,
      domain: 'localhost',
      path: '/',
    },
  ]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message.slice(0, 140)));

  await page.goto(`${reportBaseUrl()}/reports`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  return { browser, page, errors };
}
