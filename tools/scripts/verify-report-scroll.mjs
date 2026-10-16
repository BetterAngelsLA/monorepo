/**
 * Fails if changing a control on the Reports page moves the reader's scroll position.
 *
 * The reader reported that choosing a "Group by" threw the page back to the top. The cause was
 * a single frame in which the panel collapsed: the new grouping is a cache miss, so the rollup
 * came back empty, the page read empty as "no located interactions", and unmounted the map. The
 * document lost a panel's height, the browser clamped the scroll position to fit what was left,
 * and the position did not come back when the content did. Nothing in the existing checks
 * looked at scroll position at all, which is why it shipped.
 *
 * So this sweeps every control that re-partitions the panel and asserts, frame by frame, that
 * the position only ever holds or grows. It prints the numbers either way, so a failure says
 * which control moved the page and how far.
 *
 * Run: BASE=... SESSION=... CSRF=... node tools/scripts/verify-report-scroll.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:8090/branches/gis-regions-frontend';

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addCookies([
  { name: 'sessionid', value: process.env.SESSION, domain: 'localhost', path: '/' },
  { name: 'csrftoken', value: process.env.CSRF, domain: 'localhost', path: '/' },
]);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 140)));

await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(9000);

/**
 * Samples the outermost scroller on every frame.
 *
 * The app scrolls an inner container rather than the document, so `window.scrollY` is always
 * zero here and watching it was how this went unnoticed.
 */
await page.evaluate(() => {
  const scroller = [...document.querySelectorAll('*')]
    .filter((e) => e.scrollHeight > e.clientHeight + 200)
    .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
  window.__scroller = scroller;
  window.__frames = [];
  const sample = () => {
    window.__frames.push({
      top: Math.round(scroller.scrollTop),
      h: Math.round(scroller.scrollHeight),
      c: Math.round(scroller.clientHeight),
      map: document.querySelectorAll('.gm-style').length,
    });
    window.__raf = requestAnimationFrame(sample);
  };
  sample();
});

/** Park the reader part-way down, where a collapse below will clamp the position. */
async function park() {
  await page.evaluate(() => {
    const el = window.__scroller;
    el.scrollTop = Math.round((el.scrollHeight - el.clientHeight) * 0.6);
  });
  await page.waitForTimeout(1200);
}

const results = [];

/** Runs `act`, then reports whether the position held and how far the height dipped. */
async function step(label, act) {
  await park();
  const before = await page.evaluate(() => ({
    top: window.__scroller.scrollTop,
    h: window.__scroller.scrollHeight,
  }));
  await page.evaluate(() => {
    window.__frames = [];
  });

  await act();
  await page.waitForTimeout(6000);

  const after = await page.evaluate(() => ({
    top: window.__scroller.scrollTop,
    h: window.__scroller.scrollHeight,
  }));
  const frames = await page.evaluate(() => window.__frames);

  const minTop = frames.reduce((m, f) => Math.min(m, f.top), before.top);
  const minH = frames.reduce((m, f) => Math.min(m, f.h), before.h);
  const collapsed = frames.filter((f) => f.map === 0).length;

  results.push({ label, before, after, minTop, minH, collapsedFrames: collapsed });
  console.log(
    `${label.padEnd(34)} top ${String(before.top).padStart(4)} -> ${String(after.top).padStart(4)}` +
      `   min top ${String(minTop).padStart(4)}   height ${before.h} -> ${after.h} (min ${minH })` +
      `   frames without a map: ${collapsed}`,
  );
}

const groupBy = page.locator('.ant-select').first();

await step('group by council district', async () => {
  await groupBy.click();
  await page.waitForTimeout(600);
  await page
    .locator('.ant-select-item-option', { hasText: 'City Council District' })
    .first()
    .click();
});

await step('switch to another dimension', async () => {
  await groupBy.click();
  await page.waitForTimeout(600);
  await page
    .locator('.ant-select-item-option', { hasText: 'ZIP Code' })
    .first()
    .click();
});

await step('clear the grouping', async () => {
  await groupBy.hover();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-clear').first().click({ force: true });
});

// antd's button-style radio hides the input itself, so the label is what takes the click.
const viewToggle = (name) =>
  page.locator('.ant-radio-button-wrapper', { hasText: name });

await step('switch to the clusters view', async () => {
  await viewToggle('Clusters').click();
});

await step('switch back to the density view', async () => {
  await viewToggle('Heatmap').click();
});

// A shrinking page is not itself a fault — clearing the grouping removes the table, and the
// view toggle adds and removes a notice. What must never happen is the position moving, and
// what must never happen *underneath* it is the map being torn down and rebuilt, because that
// is the collapse that clamps the position in the first place. Checking the map catches the
// cause on a reader who happens to be at the top, where a clamp is a no-op and a scroll-only
// assertion would pass while the bug was back.
const fails = [];
for (const r of results) {
  if (r.minTop < r.before.top) {
    fails.push(
      `${r.label}: page moved up ${r.before.top - r.minTop}px (${r.before.top} -> ${r.minTop})`,
    );
  }
  if (r.collapsedFrames > 0) {
    fails.push(
      `${r.label}: the map unmounted for ${r.collapsedFrames} frame(s), which is what collapses the page`,
    );
  }
}
if (errors.length) fails.push(`${errors.length} page error(s): ${errors[0]}`);

if (fails.length) {
  console.error('\nFAIL:\n - ' + fails.join('\n - '));
  process.exitCode = 1;
} else {
  console.log(
    '\nPASS: no control moved the position, and the map stayed mounted throughout.',
  );
}

await browser.close();
