import { expect, test } from '@playwright/test';
import {
  VIEWPORTS,
  assertCollapsedNav,
  assertFlyoutNav,
  assertInlineNav,
  navLink,
  navToggle,
} from '../../../lib';

/**
 * The header on the home page, one band per describe. The nav rules live in
 * `../../../lib`; the sign-in banner and the header → sign-in navigation below
 * are home-specific.
 *
 * The flyout's interactions are shell behaviour, so they run here once rather
 * than once per page — the sign-in equivalent is composition-only.
 * `.z-flyout-mask` is a literal DOM class token unique to Flyout, so it is safe
 * to scope on.
 */
test.describe('header nav (desktop)', () => {
  test.use({ viewport: VIEWPORTS.DESKTOP });

  test('renders header navigation and the sign-in banner', async ({ page }) => {
    await page.goto('./');

    await expect(page).toHaveTitle('Shelter LA');

    await assertInlineNav(page);

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

  test('navigates to the sign-in page from the header', async ({ page }) => {
    await page.goto('./');

    await navLink(page.locator('header'), 'Sign In').click();

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

    await navToggle(page).click();

    const flyout = page.locator('.z-flyout');
    await expect(flyout).toBeVisible();

    // For an anonymous session the flyout's only button is close.
    await flyout.getByRole('button').click();
    await expect(flyout).toBeHidden();
  });

  test('navigating from the flyout closes it', async ({ page }) => {
    await page.goto('./');

    await navToggle(page).click();

    const flyout = page.locator('.z-flyout');
    await expect(flyout).toBeVisible();

    await navLink(flyout, 'Watch Video').click();

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

    await navToggle(page).click();

    const mask = page.locator('.z-flyout-mask');
    await expect(mask).toBeVisible();

    // The panel is 96vw wide, so only a thin strip on the left side is mask.
    await mask.click({ position: { x: 5, y: 300 } });

    await expect(page.locator('.z-flyout')).toBeHidden();
  });
});
