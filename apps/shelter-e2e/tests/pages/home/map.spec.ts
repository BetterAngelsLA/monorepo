import { test } from '@playwright/test';
import {
  assertCurrentLocation,
  assertMapUi,
  presetLoginBannerDismissed,
} from '../../../lib';

/**
 * The map as home mounts it. The rules are `lib/map`'s; size-agnostic, pins no
 * viewport.
 */

/** Where the browser claims to be — well away from the app's LA fallback. */
const MOCK_LOCATION = { latitude: 34.31, longitude: -118.03 };

test.beforeEach(async ({ page }) => {
  await presetLoginBannerDismissed(page);

  await page.goto('./');
});

test('renders the map and drives its controls', async ({ page }) => {
  await assertMapUi(page);
});

test.describe('with the location permission granted', () => {
  test.use({ permissions: ['geolocation'], geolocation: MOCK_LOCATION });

  test('opens and recentres on the browser location', async ({ page }) => {
    await assertCurrentLocation(page, MOCK_LOCATION);
  });
});
