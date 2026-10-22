import type { Locator, Page } from '@playwright/test';
import { NAV_TOGGLE_LABEL, type NavTarget } from './constants';

/**
 * How the suite asks the header questions: where its links and controls are, and
 * what each link should point at. What must be true of them lives in the band
 * files.
 */

/**
 * The nav link showing `label` inside `scope`.
 *
 * Located by its visible text, not by accessible name: the app's `aria-label`s
 * override the text, so a role-name lookup would find the link by the attribute
 * and would not notice the label changing.
 */
export function navLink(scope: Locator, label: string): Locator {
  return scope.getByRole('link').filter({ hasText: label });
}

/**
 * The header control that opens the flyout.
 *
 * Addressed by its accessible name rather than as "the header's button": that
 * lookup only worked while the hamburger happened to be the only button in the
 * header, and a name also asserts the icon-only control is labelled at all.
 */
export function navToggle(page: Page): Locator {
  return page.locator('header').getByRole('button', { name: NAV_TOGGLE_LABEL });
}

/**
 * The `href` a link should carry.
 *
 * Internal routes are matched as a suffix, because deployed builds are served
 * from a base path (`/branches/<branch>/`): the same link renders `/video`
 * locally and `/branches/<branch>/video` there. Absolute targets match exactly —
 * they're the one thing that doesn't move with the base path.
 *
 * The home link is the base path itself, and React Router renders `to="/"` as
 * that base *without* its trailing slash: `/branches/<branch>` when deployed,
 * `/` at the root. Its expectation is therefore read from `document.baseURI`
 * (the app injects `<base href>` at build time) rather than restated here — the
 * suite doesn't need to know the branch, and a mismatch is what the assertion is
 * for.
 */
export async function expectedHref(
  page: Page,
  target: NavTarget,
): Promise<string | RegExp> {
  if ('url' in target) {
    return target.url;
  }

  if (target.path === '/') {
    const { pathname } = new URL(await page.evaluate(() => document.baseURI));

    return new RegExp(`^${escapeRegExp(pathname.replace(/\/$/, '')) || '/'}$`);
  }

  return new RegExp(`(?:^|/)${target.path.slice(1)}/?$`);
}

/** Branch names can carry regex metacharacters (a `.` is common). */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
