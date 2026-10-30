import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { TSheltersResponse } from '../../../lib';
import {
  getEmptyList,
  getResultCount,
  getResultsSource,
  getSearchThisAreaButton,
  getShelterCard,
  makeShelter,
  mockPublicShelters,
  presetLoginBannerDismissed,
} from '../../../lib';

/**
 * The home page's shelter search: the `Search` entry and the results panel it
 * feeds. Size-agnostic: pins no viewport.
 */

/** The panel does not query until a search runs, so fire one through the map. */
async function openHomeAndSearchShelters(
  page: Page,
  response: TSheltersResponse,
): Promise<void> {
  await mockPublicShelters(page, response);

  await presetLoginBannerDismissed(page);

  await page.goto('./');

  await getSearchThisAreaButton(page).click();
}

test('shows the search entry', async ({ page }) => {
  await page.goto('./');

  // `exact` excludes the map's "Search this area".
  await expect(
    page.getByRole('button', { name: 'Search', exact: true }),
  ).toBeVisible();
});

test('the search entry opens the /search route', async ({ page }) => {
  await page.goto('./');

  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page).toHaveURL(/\/search\/?$/);
});

test('shows a count and source line with live data', async ({ page }) => {
  await page.goto('./');

  // Whether a search runs depends on the environment; both states show these.
  await expect(getResultCount(page)).toBeVisible({ timeout: 15_000 });
  await expect(getResultsSource(page)).toBeVisible();
});

test.describe('with the shelters response stubbed', () => {
  test('lists every shelter in the response', async ({ page }) => {
    await openHomeAndSearchShelters(page, {
      results: [
        makeShelter({ id: 'stub-1', name: 'Hope House' }),
        makeShelter({ id: 'stub-2', name: 'Second House' }),
      ],
      totalCount: 2,
    });

    await expect(getResultCount(page)).toHaveText('2 of 2 locations');
    await expect(getResultsSource(page)).toHaveText('(based on map area)');
    await expect(getShelterCard(page, 'Hope House')).toBeVisible();
    await expect(getShelterCard(page, 'Second House')).toBeVisible();
    await expect(getEmptyList(page)).toHaveCount(0);
  });

  test('counts a short page against the server total', async ({ page }) => {
    await openHomeAndSearchShelters(page, {
      results: [makeShelter({ id: 'stub-1', name: 'Hope House' })],
      // The query asks for 5000 at a time; the total is what the server counted.
      totalCount: 9,
    });

    await expect(getResultCount(page)).toHaveText('1 of 9 locations');
    await expect(getShelterCard(page, 'Hope House')).toBeVisible();
  });

  test('renders the empty state for an empty response', async ({ page }) => {
    await openHomeAndSearchShelters(page, { results: [], totalCount: 0 });

    await expect(getResultCount(page)).toHaveText('0 of 0 locations');
    await expect(getEmptyList(page)).toBeVisible();
  });
});
