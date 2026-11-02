import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
  getEmptyList,
  getPanelError,
  getResolvedResultCount,
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

/**
 * The panel unmounts its header and empty view while a query is in flight, so a
 * cold remote API can leave nothing to assert on for longer than the default
 * 5s expect timeout.
 */
const PANEL_TIMEOUT = 15_000;

/**
 * The panel swaps its count line for `ErrorListView` when the request fails.
 * Without a backend that is the honest state of a dev server, so a local run
 * skips; a run against a deployed environment has an API behind it by
 * definition — CI only starts this suite when it deployed the app — so an error
 * there is a failure, not something to step around.
 */
async function skipWhenApiUnavailable(page: Page): Promise<void> {
  await expect(
    getResolvedResultCount(page).or(getPanelError(page)),
  ).toBeVisible({ timeout: PANEL_TIMEOUT });

  if (!(await getPanelError(page).isVisible())) {
    return;
  }

  const reason =
    'the shelter API is unreachable, so the panel has no data to compare against';

  // A skip here is a fact about this machine, not about the app.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(isLocalBaseUrl(), reason);

  throw new Error(`${reason} (${page.url()})`);
}

function isLocalBaseUrl(): boolean {
  const { baseURL } = test.info().project.use;

  return !baseURL || new URL(baseURL).hostname === 'localhost';
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

test('searching this area reports a count and where the results came from', async ({
  page,
}) => {
  await presetLoginBannerDismissed(page);
  await page.goto('./');

  await getSearchThisAreaButton(page).click();
  await skipWhenApiUnavailable(page);

  await expect(getResultCount(page)).toHaveText(/^\d+ of \d+ locations$/, {
    timeout: PANEL_TIMEOUT,
  });
  await expect(getResultsSource(page)).toHaveText('(based on map area)', {
    timeout: PANEL_TIMEOUT,
  });
});

test('searching a listed shelter by name lists it again', async ({ page }) => {
  await presetLoginBannerDismissed(page);
  await page.goto('./');

  await getSearchThisAreaButton(page).click();
  await skipWhenApiUnavailable(page);

  await expect(getResultCount(page)).toHaveText(/^\d+ of \d+ locations$/, {
    timeout: PANEL_TIMEOUT,
  });

  const [name] = await getShelterCardNames(page);

  expect(
    name,
    'the environment returned no public shelters in the default map area',
  ).toBeTruthy();

  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByPlaceholder('Search by name').fill(name);
  await page.getByRole('button', { name: 'Done' }).click();

  await skipWhenApiUnavailable(page);

  // The card is already on screen from the map-area search, so the source line
  // is what proves the name filter ran.
  await expect(getResultsSource(page)).toHaveText('(based on name search)', {
    timeout: PANEL_TIMEOUT,
  });
  await expect(getShelterCard(page, name)).toBeVisible({
    timeout: PANEL_TIMEOUT,
  });
});

test('shows the empty state for a name the server does not match', async ({
  page,
}) => {
  await presetLoginBannerDismissed(page);
  await page.goto('./');

  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByPlaceholder('Search by name').fill(UNMATCHABLE_NAME);
  await page.getByRole('button', { name: 'Done' }).click();

  await skipWhenApiUnavailable(page);

  // The source line proves the name filter was applied; the empty state is the
  // state-specific signal, and its presence means the query has resolved.
  await expect(getResultsSource(page)).toHaveText('(based on name search)', {
    timeout: PANEL_TIMEOUT,
  });
  await expect(getEmptyList(page)).toBeVisible({ timeout: PANEL_TIMEOUT });
  await expect(getResultCount(page)).toHaveText('0 of 0 locations', {
    timeout: PANEL_TIMEOUT,
  });
});
