import { expect, type Page } from '@playwright/test';
import { NAV_LINKS } from './constants';
import { expectedHref, navLink, navToggle } from './queries';

/**
 * The header at `lg` (1152px) and up: every link is inline, points where it
 * should, and the mobile toggle is hidden.
 *
 * The header is rendered on every page (`MainLayout` renders `<Header />` above
 * the route outlet), so this rule is applied by each page's own spec —
 * `home/nav.spec.ts`, `sign-in/nav.spec.ts` — rather than by a separate shell
 * spec that would reload every route to check one shared component. A page
 * whose header differs overrides the rule there instead of forking this file.
 *
 * The below-`lg` counterpart is `flyout-nav.ts`.
 */
export async function assertInlineNav(page: Page): Promise<void> {
  const header = page.locator('header');

  for (const link of NAV_LINKS) {
    const item = navLink(header, link.label);

    await expect(item).toBeVisible();
    await expect(item).toHaveText(link.label);
    await expect(item).toHaveAttribute('href', await expectedHref(page, link));
  }

  await expect(navToggle(page)).toBeHidden();
}
