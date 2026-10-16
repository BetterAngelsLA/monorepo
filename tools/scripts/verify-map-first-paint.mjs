/**
 * Asserts the map paints with NO interaction at all.
 *
 * `verify-map-rendering.mjs` scrolls the panel into view before capturing — and scrolling is
 * itself what makes Google redraw the map and deck draw its canvas. So it passed while the map
 * was blank on a cold load. A tall viewport puts the map on screen without any scroll.
 *
 * The canvas is selected through its deck.gl ancestor rather than as "the canvas inside the map
 * container". The two are the same element on this page, but the assertion is about *deck's*
 * output, so it says so: if Google ever renders its basemap to its own canvas, a `.gm-style
 * canvas` selector could measure that instead and report a painted map while the data layer
 * drew nothing — the exact failure this script exists to catch.
 *
 * Run: BASE=... SESSION=... CSRF=... node tools/scripts/verify-map-first-paint.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:8090/branches/gis-regions-frontend';
const DECK_CANVAS = '.gm-style [class*="deck"] canvas';

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1600 } });
await ctx.addCookies([
  { name: 'sessionid', value: process.env.SESSION, domain: 'localhost', path: '/' },
  { name: 'csrftoken', value: process.env.CSRF, domain: 'localhost', path: '/' },
]);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded', timeout: 60000 });

// No scrolling, no panning, no resizing. Just wait.
for (const t of [4000, 12000]) {
  await page.waitForTimeout(t === 4000 ? 4000 : 8000);
  const canvas = await page
    .locator(DECK_CANVAS)
    .first()
    .boundingBox()
    .catch(() => null);
  console.log(
    `t=${t}ms  deck canvas: ${canvas ? `${Math.round(canvas.width)}x${Math.round(canvas.height)}` : 'absent'}`,
  );
}
const canvas = await page
  .locator(DECK_CANVAS)
  .first()
  .boundingBox()
  .catch(() => null);
const painted = canvas && canvas.width > 50 && canvas.height > 50;
console.log(
  painted
    ? '\nPASS: map painted with no interaction.'
    : '\nFAIL: canvas is 1x1 or absent — the map never got its first draw.',
);
if (errs.length) console.log('pageErrors:', errs.slice(0, 2));
process.exitCode = painted ? 0 : 1;
await browser.close();
