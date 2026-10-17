/**
 * The shared Playwright bootstrap for the Reports-page verification scripts.
 *
 * All the Reports-page verification runs need the same thing before they can assert anything:
 * Chrome, a context, the session cookies, the Reports page, and a collector for page errors.
 *
 * The cookie injection is the part worth having exactly one copy of. The API sets
 * `Set-Cookie: sessionid=…` with **no `Domain` attribute**, so the cookie is host-only: a page
 * served from `localhost` cannot see a cookie issued for `127.0.0.1` and vice versa, and the
 * login POST then fails 403 "CSRF cookie not set". The domain is therefore derived from `BASE`
 * rather than hard-coded, so either spelling works as long as it matches the address bar.
 *
 * The caller owns the browser: wrap every assertion in `try/finally` and call
 * `browser.close()` in the `finally`, or a throwing check leaks a Chrome process.
 */
import { chromium } from 'playwright';

/** The admin app's vite dev server (`SERVER_PORT` in the app's `vite.config.mts`). */
export const DEFAULT_BASE = 'http://localhost:8084';

/** `BASE` override, or the local dev server. Point it at a preview with `BASE=…`. */
export function reportBaseUrl() {
  return process.env.BASE ?? DEFAULT_BASE;
}

/**
 * The two cookie values, or a message that says how to get them.
 *
 * Passed straight to Playwright they fail with "cookie should have a value", which does not
 * say which variable is missing or where it comes from.
 */
function sessionCookies(host) {
  const missing = ['SESSION', 'CSRF'].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `${missing.join(' and ')} must be set: copy the \`sessionid\` and \`csrftoken\` cookie values from a signed-in admin tab (DevTools → Application → Cookies).`,
    );
  }
  return [
    {
      name: 'sessionid',
      value: process.env.SESSION,
      domain: host,
      path: '/',
    },
    {
      name: 'csrftoken',
      value: process.env.CSRF,
      domain: host,
      path: '/',
    },
  ];
}

/**
 * Launch Chrome, inject the session cookies, open `${BASE}/reports` and start collecting page
 * errors, which the caller reports alongside its own assertions.
 */
export async function openReports({
  viewport = { width: 1600, height: 1000 },
} = {}) {
  const base = reportBaseUrl();
  let host;
  try {
    host = new URL(base).hostname;
  } catch {
    throw new Error(`BASE is not a URL: ${base}`);
  }
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport });
    await context.addCookies(sessionCookies(host));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message.slice(0, 140)));

    await page.goto(`${base}/reports`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    return { browser, page, errors };
  } catch (error) {
    // The caller's `finally` never runs if we throw here, so close the browser ourselves.
    await browser.close();
    throw error;
  }
}
