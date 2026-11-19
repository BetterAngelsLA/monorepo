import { test } from '@playwright/test';
import {
  VIEWPORTS,
  assertCollapsedNav,
  assertFlyoutNav,
  assertInlineNav,
} from '../../../lib';

/**
 * The header on the sign-in page: composition only, since the rules are
 * `lib/navigation`'s and the flyout's interactions run in `layout/nav.spec.ts`.
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
