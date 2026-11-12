import { expect, test } from '@playwright/test';
import { analyticsConfigured } from '../../../lib/analytics';
import { shelterEntryUrl } from '../../../lib/framework';

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
 *
 * It reads the capture payloads, which only exist on a build that accepts an
 * automated browser: a dev server, or a preview built with `VITE_POSTHOG_E2E`
 * (see `buildInitConfig`). Both are what CI runs, so there is nothing to skip.
 */
test('records and delivers session snapshots', async ({ page }) => {
  test.skip(
    !analyticsConfigured(),
    'shelter-web is running without VITE_POSTHOG_API_KEY',
  );
  test.setTimeout(120_000);

  const snapshotSizes: number[] = [];

  page.on('request', (request) => {
    const { pathname } = new URL(request.url());

    if (pathname === '/s/' && request.postDataBuffer()) {
      snapshotSizes.push(request.postDataBuffer()!.length);
    }
  });

  await page.goto(shelterEntryUrl());
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
