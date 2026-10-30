import { expect, test } from '@playwright/test';
import {
  fetchShelters,
  getEmptyList,
  getResultCount,
  getResultsSource,
  getSearchThisAreaButton,
  getShelterCard,
  getShelterCardNames,
  presetLoginBannerDismissed,
} from '../../../lib';

/**
 * The home page's shelter search: the `Search` entry and the results panel it
 * feeds. Expectations come from the environment's own data, so the same specs
 * run against local, DEV and prod. Size-agnostic: pins no viewport.
 */

const UNMATCHABLE_NAME = 'no-shelter-by-this-name';

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

test('searching this area reports a count and where the results came from', async ({
  page,
}) => {
  await presetLoginBannerDismissed(page);
  await page.goto('./');

  await getSearchThisAreaButton(page).click();

  await expect(getResultCount(page)).toHaveText(/^\d+ of \d+ locations$/);
  await expect(getResultsSource(page)).toHaveText('(based on map area)');
});

test('searching a listed shelter by name lists it again', async ({ page }) => {
  await presetLoginBannerDismissed(page);
  await page.goto('./');

  await getSearchThisAreaButton(page).click();

  await expect(getResultCount(page)).toHaveText(/^\d+ of \d+ locations$/);

  const [name] = await getShelterCardNames(page);

  expect(
    name,
    'the environment returned no public shelters in the default map area',
  ).toBeTruthy();

  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByPlaceholder('Search by name').fill(name);
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(getShelterCard(page, name)).toBeVisible();
});

test('shows the empty state for a name the server does not match', async ({
  page,
}) => {
  const { totalCount } = await fetchShelters(page, { name: UNMATCHABLE_NAME });

  expect(totalCount).toBe(0);

  await presetLoginBannerDismissed(page);
  await page.goto('./');

  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByPlaceholder('Search by name').fill(UNMATCHABLE_NAME);
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(getResultCount(page)).toHaveText('0 of 0 locations');
  await expect(getEmptyList(page)).toBeVisible();
});
