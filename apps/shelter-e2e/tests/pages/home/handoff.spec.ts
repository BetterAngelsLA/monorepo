import { expect, test } from '@playwright/test';
import { recordPostHog, uuidv7, waitForEvent } from '../../../lib/analytics';

/**
 * The receiving half of the shelter handoff: the app opens this site with
 * `#ba_did=<distinct id>&ba_sid=<session id>`, and this site continues that
 * session.
 *
 * Asserted from the capture payloads rather than the UI, because "the address
 * bar looks right" cannot distinguish a session that was adopted from one that
 * was rejected and replaced.
 */
test('continues the session the app handed over', async ({ page }) => {
  const events = recordPostHog(page);
  const distinctId = 'e2e-handoff-distinct';
  const sessionId = uuidv7();

  await page.goto(`/#ba_did=${distinctId}&ba_sid=${sessionId}`);

  const landed = await waitForEvent(events, 'shelter_search_landed');

  expect(landed.properties.app).toBe('shelter-web');
  expect(landed.properties.handoff).toBe(true);
  expect(landed.properties.handoff_person).toBe(true);
  expect(landed.properties.handoff_matched).toBe(true);

  // The visit has to join the app's session, not just know the person.
  expect(String(landed.properties.distinct_id)).toBe(distinctId);
  expect(String(landed.properties.$session_id)).toBe(sessionId);

  // The fragment is an identifier in the address bar, so it never survives.
  expect(page.url()).not.toContain('ba_');
  expect(await page.evaluate(() => window.location.hash)).toBe('');
});

/**
 * The failure the funnel has to be able to see: an id arrived, the SDK refused
 * it (a bootstrapped session must be a UUIDv7 under 24 hours old), and the site
 * quietly started a new session instead.
 */
test('reports a handoff the receiver refused', async ({ page }) => {
  const events = recordPostHog(page);
  // Valid UUID shape, wrong version: posthog-js mints its own session.
  const sessionId = '3f6c6c1e-9c0b-4c1a-9d2e-0a1b2c3d4e5f';

  await page.goto(`/#ba_did=e2e-refused-distinct&ba_sid=${sessionId}`);

  const landed = await waitForEvent(events, 'shelter_search_landed');

  expect(landed.properties.handoff).toBe(true);
  expect(landed.properties.handoff_matched).toBe(false);
  expect(String(landed.properties.$session_id)).not.toBe(sessionId);
});
