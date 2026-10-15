/**
 * Fails if the map is not actually rendering what it claims to.
 *
 * Four changes this session looked correct and were not: a hand-computed colour domain that
 * flattened the field, a reduced `weightsTextureSize` that did the same, a screen-space cluster
 * grid that re-partitioned per pan, and a boundary layer painted over by the density mesh. Each
 * was caught by looking, and two shipped because a *neighbouring* view was checked instead.
 *
 * This asserts the two things the reader is promised, on the real backend:
 *   - the density field is present and warm somewhere (not a flat cold blob)
 *   - the boundary strokes are present when a dimension is grouped
 * It prints the numbers either way, so a failure says which one moved.
 *
 * Run: BASE=... SESSION=... CSRF=... node tmp/verify-map-rendering.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:8090/branches/gis-regions-frontend';
const OUT = process.env.OUT ?? '/tmp';

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addCookies([
  { name: 'sessionid', value: process.env.SESSION, domain: 'localhost', path: '/' },
  { name: 'csrftoken', value: process.env.CSRF, domain: 'localhost', path: '/' },
]);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));

await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);
// The app scrolls an inner container; wheel and fullPage do not reach the map.
await page.evaluate(() => {
  for (const el of [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 200)) el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(9000);

const shot = async (name) => {
  const map = page.locator('.gm-style').first();
  const path = `${OUT}/${name}.png`;
  await map.screenshot({ path });
  return path;
};

const warmShare = async (path) => {
  // Count warm pixels by decoding the PNG in the page — no image library needed here.
  const b64 = (await import('node:fs')).readFileSync(path).toString('base64');
  return page.evaluate(async (data) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height).data;
    let warm = 0, dark = 0, total = 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], gg = px[i + 1], b = px[i + 2];
      total++;
      if (r > 140 && r > b + 40) warm++;
      if (r < 90 && gg < 90 && b < 140) dark++;
    }
    return { warm: (warm * 100) / total, dark: (dark * 100) / total };
  }, b64);
};

const ungrouped = await shot('verify-ungrouped');
const a = await warmShare(ungrouped);

await page.locator('.ant-select').first().click();
await page.waitForTimeout(700);
await page.locator('.ant-select-item-option', { hasText: 'City Council District' }).first().click();
await page.waitForTimeout(12000);
const grouped = await shot('verify-grouped');
const b = await warmShare(grouped);

const report = {
  ungrouped: { warm: +a.warm.toFixed(2), dark: +a.dark.toFixed(2) },
  grouped: { warm: +b.warm.toFixed(2), dark: +b.dark.toFixed(2) },
  pageErrors: errors.length,
};
console.log(JSON.stringify(report, null, 2));

const fails = [];
if (a.warm < 1) fails.push(`density field missing ungrouped (warm ${a.warm.toFixed(2)}%)`);
if (b.warm < 1) fails.push(`density field missing grouped (warm ${b.warm.toFixed(2)}%) — flat cold blob?`);
if (errors.length) fails.push(`${errors.length} page error(s): ${errors[0]}`);
// Strokes are thin, so this is a floor rather than a strong assertion; it catches "no boundaries at all".
if (b.dark < 0.05) fails.push(`no boundary strokes visible grouped (dark ${b.dark.toFixed(2)}%)`);

if (fails.length) {
  console.error('\nFAIL:\n - ' + fails.join('\n - '));
  process.exitCode = 1;
} else {
  console.log('\nPASS: density field and boundary strokes both present.');
}
writeFileSync(`${OUT}/verify-map-rendering.json`, JSON.stringify(report, null, 2));
await browser.close();
