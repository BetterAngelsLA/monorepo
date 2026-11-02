import { expect, type Page } from '@playwright/test';
import { FLYOUT_LINKS, NAV_LINKS } from './constants';
import { getNavLink, getNavToggle } from './getters';
import { expectedHref } from './utils';

/** The header at `lg` and up: links inline and pointing at their targets, no toggle. */
export async function assertInlineNav(page: Page): Promise<void> {
  const header = page.locator('header');

  for (const link of NAV_LINKS) {
    const item = getNavLink(header, link.label);

    await expect(item).toBeVisible();
    await expect(item).toHaveText(link.label);
    await expect(item).toHaveAttribute('href', await expectedHref(page, link));
  }

  await expect(getNavToggle(page)).toBeHidden();
}

/** The resting state below `lg`: the toggle is there, the inline links are not. */
export async function assertCollapsedNav(page: Page): Promise<void> {
  const header = page.locator('header');

  await expect(getNavToggle(page)).toBeVisible();

  for (const link of NAV_LINKS) {
    await expect(getNavLink(header, link.label)).toBeHidden();
  }
}

/** The open flyout: same links as the inline nav, plus the directory PDF. */
export async function assertFlyoutNav(page: Page): Promise<void> {
  await getNavToggle(page).click();

  // A literal DOM class token unique to Flyout, so it is safe to scope on.
  const flyout = page.locator('.z-flyout');
  await expect(flyout).toBeVisible();

  for (const link of FLYOUT_LINKS) {
    const item = getNavLink(flyout, link.label);

    await expect(item).toBeVisible();
    await expect(item).toHaveText(link.label);
    await expect(item).toHaveAttribute('href', await expectedHref(page, link));
  }
}
