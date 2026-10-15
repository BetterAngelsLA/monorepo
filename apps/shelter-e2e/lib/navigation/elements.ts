import type { Locator, Page } from '@playwright/test';
import type { NavTarget } from './constants';

/**
 * How the header's elements are addressed: the locators, the labels they are
 * addressed by, and the `href` each link should carry. What must be true of
 * them lives in the band files.
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
 * The accessible name the app gives the header's hamburger — an icon-only
 * button, so `aria-label` is what names it.
 */
export const NAV_TOGGLE_LABEL = 'Open navigation';

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
 * from `/branches/<branch>/`: the same link renders `/video` locally and
 * `/branches/<branch>/video` there, while the home link is the base path
 * itself, which ends in a slash either way. Absolute targets match exactly —
 * they're the one thing that doesn't move with the base path.
 */
export function expectedHref(target: NavTarget): string | RegExp {
  if ('url' in target) {
    return target.url;
  }

  if (target.path === '/') {
    return /\/$/;
  }

  return new RegExp(`(?:^|/)${target.path.slice(1)}/?$`);
}
