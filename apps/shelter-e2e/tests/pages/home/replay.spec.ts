import { e2eBaseUrl } from '../../../../../tools/shared/e2e-base-url.mjs';
import { expect, test } from '@playwright/test';

/**
 * These assert the capture payloads, so they need a server where the SDK is
 * allowed to send them: a dev build opts out of the bot filter (see
 * `buildInitConfig`), a deployed build does not. CI runs this suite against the
 * branch preview, where every automated request is dropped before it leaves the
 * browser — so skip there rather than time out, and keep the assertions for
 * `yarn shelter:e2e`, which starts a dev server.
 */
const previewBaseUrl = e2eBaseUrl('shelter-web');

test.skip(
  Boolean(previewBaseUrl),
  `capture payloads need a dev build; ${previewBaseUrl} is built for production`,
);

/**
 * Session replay actually delivering, not just enabled.
 *
 * `$recording_status` is misleading on its own: the event captured at init
 * reports `disabled` because the SDK has not fetched its remote config yet, and
 * reading that one field says "off" while the recorder is starting up. What
 * proves replay works is a snapshot payload leaving the browser.
 *
 * The recorder flushes on an interval and on activity, so this waits for real
 * traffic rather than asserting immediately.
 */
test('records and delivers session snapshots', async ({ page }) => {
  test.setTimeout(120_000);

  const snapshotSizes: number[] = [];

  page.on('request', (request) => {
    const { pathname } = new URL(request.url());

    if (pathname === '/s/' && request.postDataBuffer()) {
      snapshotSizes.push(request.postDataBuffer()!.length);
    }
  });

  await page.goto('/');
  await page.waitForTimeout(10_000);

  // Give the recorder something to record and a reason to flush.
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(15_000);

  expect(snapshotSizes.length, 'no snapshot payload was sent').toBeGreaterThan(
    0,
  );
  // A full snapshot carries the DOM; a keepalive-only payload would be tiny.
  expect(Math.max(...snapshotSizes)).toBeGreaterThan(1_000);
});
