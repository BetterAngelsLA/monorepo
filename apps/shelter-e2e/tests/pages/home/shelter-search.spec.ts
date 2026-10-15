import { expect, test } from '@playwright/test';

/**
 * The shelter search UI on the home page — `ShelterSearch` plus the results it
 * feeds (`SheltersDisplay`).
 *
 * On home the entries are navigation: `Search` opens the `/search` route and the
 * filter button opens `/filters`, both nested routes of home.
 *
 * Results are asserted with tolerant patterns because their state depends on
 * the environment: locally the app talks to `VITE_SHELTER_API_URL`
 * (`http://localhost:8000` — typically not running in the dev container), and
 * deployed environments differ in whether the searched area has public
 * shelters. The panel settles into one of:
 *
 *   "0 locations"      + "(based on search area)" — auto-search never resolved
 *   "0 of 0 locations" + "(based on map area)"    — search done, none found
 *   "N of M locations" + "(based on map area)"    — search done, N found
 *
 * The exact empty-state copy ("0 of 0 locations" / "No results" / "Try
 * searching for something else.") is data-dependent and only asserted against
 * deployed environments via `BASE_URL` (see the last test).
 *
 * Size-agnostic: pins no viewport.
 */
test('renders the search entry', async ({ page }) => {
  await page.goto('./');

  // `exact` so it doesn't also match "Search this area" on the map.
  await expect(
    page.getByRole('button', { name: 'Search', exact: true }),
  ).toBeVisible();
});

test('the search entry opens the /search route', async ({ page }) => {
  await page.goto('./');

  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page).toHaveURL(/\/search\/?$/);
});

test('renders the results panel with a count and source line', async ({
  page,
}) => {
  await page.goto('./');

  const countLine = page
    .getByText(/^\d+( of \d+)? locations?$/)
    .filter({ visible: true })
    .first();

  // Waits for the auto-search to settle on environments where it can run,
  // and passes immediately on the pre-search state where it cannot.
  await expect(countLine).toBeVisible({ timeout: 15_000 });
  await expect(
    page
      .getByText(/\(based on .* area\)/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

test('shows the empty results state', async ({ page }) => {
  test.skip(
    !process.env['BASE_URL'],
    'Asserts data-dependent copy — runs against deployed environments via BASE_URL.',
  );

  await page.goto('./');

  // Deployed environments complete the auto-search for the initial map
  // bounds; with no public shelters in the area the panel settles empty.
  await expect(page.getByText('0 of 0 locations')).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText('(based on map area)')).toBeVisible();
  await expect(page.getByText('No results')).toBeVisible();
  await expect(
    page.getByText('Try searching for something else.'),
  ).toBeVisible();
});
