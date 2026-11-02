import { expect, test } from '@playwright/test';
import {
  VIEWPORTS,
  assertCollapsedNav,
  assertFlyoutNav,
  assertInlineNav,
  getNavLink,
  getNavToggle,
} from '../../lib';

/**
 * The layout header, one band per describe, run on home. The rules are
 * `lib/navigation`'s; this file owns the flyout's interactions too.
 */
test.describe('header nav (desktop)', () => {
  test.use({ viewport: VIEWPORTS.DESKTOP });

  test('shows the inline nav', async ({ page }) => {
    await page.goto('./');

    await expect(page).toHaveTitle('Shelter LA');

    await assertInlineNav(page);
  });

  test('navigates to the sign-in page from the header', async ({ page }) => {
    await page.goto('./');

    await getNavLink(page.locator('header'), 'Sign In').click();

    await expect(page).toHaveURL(/\/sign-in\/?$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});

test.describe('header nav (mobile)', () => {
  test.use({ viewport: VIEWPORTS.MOBILE });

  test('shows the hamburger instead of the inline nav', async ({ page }) => {
    await page.goto('./');

    await expect(page).toHaveTitle('Shelter LA');

    await assertCollapsedNav(page);
  });

  test('hamburger opens the flyout with all nav links', async ({ page }) => {
    await page.goto('./');

    await assertCollapsedNav(page);
    await assertFlyoutNav(page);
  });

  test('close button dismisses the flyout', async ({ page }) => {
    await page.goto('./');

    await getNavToggle(page).click();

    const flyout = page.locator('.z-flyout');
    await expect(flyout).toBeVisible();

    // For an anonymous session the flyout's only button is close.
    await flyout.getByRole('button').click();
    await expect(flyout).toBeHidden();
  });

  test('navigating from the flyout closes it', async ({ page }) => {
    await page.goto('./');

    await getNavToggle(page).click();

    const flyout = page.locator('.z-flyout');
    await expect(flyout).toBeVisible();

    await getNavLink(flyout, 'Watch Video').click();

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

    await getNavToggle(page).click();

    const mask = page.locator('.z-flyout-mask');
    await expect(mask).toBeVisible();

    // The panel is 96vw wide, so only a thin strip on the left side is mask.
    await mask.click({ position: { x: 5, y: 300 } });

    await expect(page.locator('.z-flyout')).toBeHidden();
  });
});
