import { test } from '@playwright/test';
import {
  VIEWPORTS,
  assertCollapsedNav,
  assertFlyoutNav,
  assertInlineNav,
} from '../../../lib';

/**
 * The header on the sign-in page. The rules live in `../../../lib`; this file
 * only proves they hold here, because the header is shared by every page.
 *
 * Composition only — the flyout's interactions (open/close/mask/navigate) are
 * shell behaviour and are covered once in `pages/home/nav.spec.ts`.
 */
test.describe('header nav (desktop)', () => {
  test.use({ viewport: VIEWPORTS.DESKTOP });

  test('shows the inline nav', async ({ page }) => {
    await page.goto('sign-in');

    await assertInlineNav(page);
  });
});

test.describe('header nav (mobile)', () => {
  test.use({ viewport: VIEWPORTS.MOBILE });

  test('shows the hamburger and the flyout nav', async ({ page }) => {
    await page.goto('sign-in');

    await assertCollapsedNav(page);
    await assertFlyoutNav(page);
  });
});
