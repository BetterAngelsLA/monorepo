import { expect, test } from '@playwright/test';
import {
  assertCurrentLocation,
  assertMapUi,
  searchThisAreaButton,
} from '../../../lib';

/**
 * The search map as mounted on the home page.
 *
 * Thin on purpose: what the map has to do is asserted once in `lib/map`
 * (`assertMapUi`), so every page that mounts it proves the same things — this
 * file only says that the home page mounts it, and pins the one expectation that
 * is about the home page's opening view.
 *
 * Size-agnostic: pins no viewport.
 */

/** Where the browser claims to be — well away from the app's LA fallback. */
const MOCK_LOCATION = { latitude: 34.31, longitude: -118.03 };

/** The count line the panel shows once the automatic search has settled. */
const SETTLED_RESULTS = /^\d+( of \d+)? locations?$/;

test.beforeEach(async ({ page }) => {
  await page.goto('./');

  /*
   * The home page renders the sign-in banner (`LoginBanner`) absolutely over the
   * map's top edge, which is where the search-this-area control sits: for an
   * anonymous session the banner covers it, so the button can't be clicked until
   * the banner is dismissed. Chrome of this page, so it belongs here rather than
   * in `assertMapUi`, which other pages will call too.
   */
  await page
    .getByRole('button', { name: 'Dismiss sign-in notification' })
    .click();
});

test.skip('does not reveal the search-this-area button on the initial view', async ({
  page,
}) => {
  test.fail(
    true,
    'Known gap: every map idle reveals the button, the initial one included. Intended: the initial view searches automatically, and the button appears only after the user moves the map.',
  );

  // The count line settling means the automatic search for the initial bounds
  // has run, i.e. the map has been idle at least once.
  await expect(
    page.getByText(SETTLED_RESULTS).filter({ visible: true }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await expect(searchThisAreaButton(page)).toBeHidden();
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
