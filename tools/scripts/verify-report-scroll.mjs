/**
 * Fails if changing a control on the Reports page moves the reader's scroll position.
 *
 * The reader reported that choosing a "Group by" threw the page back to the top. The cause was
 * a single frame in which the panel collapsed: the new grouping is a cache miss, so the rollup
 * came back empty, the page read empty as "no located interactions", and unmounted the map. The
 * document lost a panel's height, the browser clamped the scroll position to fit what was left,
 * and the position did not come back when the content did. The date range did the same thing to
 * the whole page, because the reports query has the same empty-on-refetch behaviour and the
 * page swapped its content for skeletons. Nothing in the existing checks looked at scroll
 * position at all, which is why both shipped.
 *
 * So this sweeps every control that re-partitions the page and asserts, frame by frame, that
 * the position only ever holds and that the map is never unmounted. It prints the numbers
 * either way, so a failure says which control moved the page and how far.
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

/** Park the reader where a collapse below would clamp the position. */
async function park(px) {
  await page.evaluate((target) => {
    const el = window.__scroller;
    el.scrollTop =
      target ?? Math.round((el.scrollHeight - el.clientHeight) * 0.6);
  }, px);
  await page.waitForTimeout(1200);
}

const results = [];

/**
 * Runs `prepare`, parks, measures `act`, then checks `verify`.
 *
 * The split exists for the date picker: its input sits at the top of the page, so clicking it
 * makes Playwright scroll the input into view — which moves the very position under test. Any
 * scroll the harness itself causes is finished and discarded before the sampler is reset, so
 * only the act under test is measured. Without this the check reports its own scroll-into-view
 * as a product bug, which is how an earlier run of it failed.
 *
 * `verify` is required rather than optional: a step whose control never actually changed would
 * otherwise pass while proving nothing, and one earlier version of this file did exactly that.
 */
async function step(label, { act, prepare, verify, parkPx }) {
  if (prepare) {
    await prepare();
  }
  await park(parkPx);
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
  const drove = await verify();

  const minTop = frames.reduce((m, f) => Math.min(m, f.top), before.top);
  const minH = frames.reduce((m, f) => Math.min(m, f.h), before.h);
  const collapsed = frames.filter((f) => f.map === 0).length;

  results.push({ label, before, after, minTop, minH, collapsedFrames: collapsed, drove });
  console.log(
    `${label.padEnd(34)} top ${String(before.top).padStart(4)} -> ${String(after.top).padStart(4)}` +
      `   min top ${String(minTop).padStart(4)}   height ${before.h} -> ${after.h} (min ${minH})` +
      `   frames without a map: ${collapsed}   drove: ${drove ? 'yes' : 'NO'}`,
  );
}

const groupBy = page.locator('.ant-select').first();
const groupByValue = () => groupBy.innerText();
const rangeValues = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.ant-picker-input input')].map((i) => i.value),
  );
const viewToggle = (name) =>
  page.locator('.ant-radio-button-wrapper', { hasText: name });

// The date range re-runs every query on the page, so it is the control most able to move the
// reader. Opening the panel is the `prepare` half; picking the days is the measurement.
await step('change the date range', {
  act: async () => {
    // The day cells live in a body-level overlay, so clicking them cannot scroll the page's
    // own scroller.
    await page
      .locator('.ant-picker-dropdown .ant-picker-cell[title="2026-09-05"]')
      .first()
      .click();
    await page.waitForTimeout(500);
    await page
      .locator('.ant-picker-dropdown .ant-picker-cell[title="2026-09-25"]')
      .first()
      .click();
  },
  prepare: async () => {
    await page.locator('.ant-picker-input input').first().click();
    await page.waitForTimeout(800);
  },
  verify: async () => {
    const values = await rangeValues();
    return values[0] === '2026-09-05' && values[1] === '2026-09-25';
  },
  // Shallower than the other steps: the picker and its calendar live at the top of the page,
  // and a panel opened there is off screen once the reader is parked low. Still a non-zero
  // position, so a collapse that would clamp the reader is still detected — and the map and
  // height assertions, which are the causal ones, do not depend on where the reader sits.
  parkPx: 60,
});

await step('group by council district', {
  act: async () => {
    await groupBy.click();
    await page.waitForTimeout(600);
    await page
      .locator('.ant-select-item-option', { hasText: 'City Council District' })
      .first()
      .click();
  },
  verify: async () =>
    (await groupByValue()).includes('City Council District'),
});

await step('switch to another dimension', {
  act: async () => {
    await groupBy.click();
    await page.waitForTimeout(600);
    await page.locator('.ant-select-item-option', { hasText: 'ZIP Code' }).first().click();
  },
  verify: async () => (await groupByValue()).includes('ZIP Code'),
});

await step('clear the grouping', {
  act: async () => {
    await groupBy.hover();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-clear').first().click({ force: true });
  },
  // Cleared, antd shows the placeholder text, which is the "All dimensions" label.
  verify: async () => (await groupByValue()).trim() === 'All dimensions',
});

// The view toggle fires no query of its own, so there is no busy state to look for; what it
// must do is change which radio is selected.
await step('switch to the clusters view', {
  act: async () => {
    await viewToggle('Clusters').click();
  },
  verify: async () =>
    (await viewToggle('Clusters').locator('input').isChecked()) === true,
});

await step('switch back to the density view', {
  act: async () => {
    await viewToggle('Heatmap').click();
  },
  verify: async () =>
    (await viewToggle('Heatmap').locator('input').isChecked()) === true,
});

// A shrinking page is not itself a fault — clearing the grouping removes the table, and the
// view toggle adds and removes a notice. What must never happen is the position moving, and
// what must never happen *underneath* it is the map being torn down and rebuilt, because that
// is the collapse that clamps the position in the first place. Checking the map catches the
// cause even on a reader who happens to be at the top, where a clamp is a no-op and a
// scroll-only assertion would pass while the bug was back.
const fails = [];
for (const r of results) {
  if (!r.drove) {
    fails.push(`${r.label}: the control did not change, so the step proved nothing`);
  }
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
    '\nPASS: every control drove, none moved the position, and the map stayed mounted.',
  );
}

await browser.close();
