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
 * The empty-state copy is not asserted here: whether an area has public shelters
 * is data, not code, and asserting it made the suite depend on what the dev API
 * happens to hold. The empty state belongs to a component test with a mocked
 * response; this file asserts the panel's shape, which holds either way.
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

test('serves the build under the base path it was deployed to', async ({
  page,
}) => {
  const deployedBaseUrl = process.env['BASE_URL'];

  test.skip(
    !deployedBaseUrl,
    'Deployed-only: the base path is baked into the bundle at build time.',
  );

  await page.goto('./');

  // The build carries the base path it was built with as `<base href>`. If that
  // disagrees with the URL under test, every asset and route resolves from the
  // wrong root — the failure this suite exists to catch, which is why it's
  // asserted rather than assumed. (A mismatch is also the cheapest possible
  // signal that BASE_URL reached the suite at all.)
  const expected = new URL(deployedBaseUrl as string).pathname;
  const actual = new URL(await page.evaluate(() => document.baseURI)).pathname;

  expect(actual).toBe(expected.endsWith('/') ? expected : `${expected}/`);
});
