import { expect, type Page } from '@playwright/test';
import { FLYOUT_LINKS, NAV_LINKS } from './constants';
import { expectedHref, navLink, navToggle } from './elements';

/**
 * The header below `lg` (1152px): the inline links are `hidden`, and a
 * hamburger stands in for them by opening the flyout (`MenuMobile`).
 *
 * `assertCollapsedNav` checks the resting state, `assertFlyoutNav` the open
 * one — call it from a below-`lg` context. Both are applied per page (see
 * `inline-nav.ts`); `.z-flyout` is a literal DOM class token unique to Flyout,
 * so it is safe to scope on.
 */

/** The resting state: the toggle is there, the inline links are not. */
export async function assertCollapsedNav(page: Page): Promise<void> {
  const header = page.locator('header');

  await expect(navToggle(page)).toBeVisible();

  for (const link of NAV_LINKS) {
    await expect(navLink(header, link.label)).toBeHidden();
  }
}

/**
 * The open state: the flyout carries the same links as the inline nav, showing
 * the same labels and pointing at the same targets, plus the directory PDF.
 */
export async function assertFlyoutNav(page: Page): Promise<void> {
  await navToggle(page).click();

  const flyout = page.locator('.z-flyout');
  await expect(flyout).toBeVisible();

  for (const link of FLYOUT_LINKS) {
    const item = navLink(flyout, link.label);

    await expect(item).toBeVisible();
    await expect(item).toHaveText(link.label);
    await expect(item).toHaveAttribute('href', expectedHref(link));
  }
}
