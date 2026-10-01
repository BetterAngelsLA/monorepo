import { expect, test } from '@playwright/test';

/**
 * Root page smoke tests, in two viewport sections:
 *
 * - desktop (default 1280x720, ≥ `lg`/1152px): header + sign-in banner,
 *   search map, results panel, and the header → sign-in navigation.
 * - mobile (375x812, < `lg`): the inline nav collapses to a hamburger that
 *   opens a flyout (`MenuMobile`) with the same links plus "Access Center
 *   Directory".
 *
 * The shelters panel is asserted with tolerant patterns because its state
 * depends on the environment: locally the app talks to `VITE_SHELTER_API_URL`
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
 */
test.describe('home page (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('renders header navigation and the sign-in banner', async ({ page }) => {
    await page.goto('./');

    await expect(page).toHaveTitle('Shelter LA');

    const header = page.locator('header');
    for (const name of [
      'navigate to shelter homepage',
      'navigate to about us',
      'watch shelter directory video overview',
      'sign in',
    ]) {
      await expect(header.getByRole('link', { name })).toBeVisible();
    }

    // The hamburger is mobile-only; at `lg`+ its icon is `hidden`, collapsing
    // the button to zero size.
    await expect(header.getByRole('button')).toBeHidden();

    const bannerCopy = page
      .getByText('Sign in with your Better Angels account')
      .first();
    await expect(bannerCopy).toBeVisible();

    const dismissButton = page.getByRole('button', {
      name: 'Dismiss sign-in notification',
    });
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();
    await expect(bannerCopy).toBeHidden();
  });

  test('renders the map with its search affordances', async ({ page }) => {
    await page.goto('./');

    // `.gm-style` is added by the Google Maps JS API, so this also proves the
    // maps key is configured for the environment being tested.
    await expect(page.locator('.gm-style')).toBeVisible({ timeout: 15_000 });

    // Shown once the map reaches idle after its initial view.
    await expect(
      page.getByRole('button', { name: 'Search this area' }),
    ).toBeVisible({
      timeout: 15_000,
    });

    // The search entry point under the map — `exact` so it doesn't also match
    // "Search this area".
    await expect(
      page.getByRole('button', { name: 'Search', exact: true }),
    ).toBeVisible();
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

  test('navigates to the sign-in page from the header', async ({ page }) => {
    await page.goto('./');

    await page.locator('header').getByRole('link', { name: 'sign in' }).click();

    await expect(page).toHaveURL(/\/sign-in\/?$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
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
});

test.describe('home page (mobile)', () => {
  // Below `lg` (1152px) the inline nav collapses to the hamburger + flyout.
  // 375x812 is a standard small viewport.
  test.use({ viewport: { width: 375, height: 812 } });

  test('shows the hamburger instead of the inline nav', async ({ page }) => {
    await page.goto('./');

    await expect(page).toHaveTitle('Shelter LA');

    const header = page.locator('header');
    await expect(header.getByRole('button')).toBeVisible();

    // The inline links are `hidden` at this width.
    for (const name of [
      'navigate to shelter homepage',
      'navigate to about us',
      'watch shelter directory video overview',
      'sign in',
    ]) {
      await expect(header.getByRole('link', { name })).toBeHidden();
    }
  });

  test('hamburger opens the flyout with all nav links', async ({ page }) => {
    await page.goto('./');

    await page.locator('header').getByRole('button').click();

    const flyout = page.locator('.z-flyout');
    await expect(flyout).toBeVisible();

    for (const name of [
      'navigate to shelter homepage',
      'navigate to about us',
      'watch shelter directory video overview',
      'sign in',
    ]) {
      await expect(flyout.getByRole('link', { name })).toBeVisible();
    }

    // The mobile menu has one link the desktop nav doesn't.
    await expect(
      flyout.getByRole('link', { name: 'Access Center Directory' }),
    ).toBeVisible();
  });

  test('close button dismisses the flyout', async ({ page }) => {
    await page.goto('./');

    await page.locator('header').getByRole('button').click();

    const flyout = page.locator('.z-flyout');
    await expect(flyout).toBeVisible();

    // For an anonymous session the flyout's only button is close.
    await flyout.getByRole('button').click();
    await expect(flyout).toBeHidden();
  });

  test('navigating from the flyout closes it', async ({ page }) => {
    await page.goto('./');

    await page.locator('header').getByRole('button').click();

    const flyout = page.locator('.z-flyout');
    await expect(flyout).toBeVisible();

    await flyout
      .getByRole('link', { name: 'watch shelter directory video overview' })
      .click();

    // Route change closes the flyout (FlyoutContainer) and the video route
    // renders its own heading.
    await expect(page).toHaveURL(/\/video\/?$/);
    await expect(flyout).toBeHidden();
    await expect(
      page.getByRole('heading', { name: 'Shelter Directory Video Overview' }),
    ).toBeVisible();
  });

  test('tapping outside the flyout dismisses it', async ({ page }) => {
    await page.goto('./');

    await page.locator('header').getByRole('button').click();

    const mask = page.locator('.z-flyout-mask');
    await expect(mask).toBeVisible();

    // The panel is 96vw wide, so only a thin strip on the left side is mask.
    await mask.click({ position: { x: 5, y: 300 } });

    await expect(page.locator('.z-flyout')).toBeHidden();
  });
});
