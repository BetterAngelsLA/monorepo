import type { Locator, Page } from '@playwright/test';
import { NAV_TOGGLE_LABEL } from './constants';

/**
 * Matched by visible text, not role name: the app's `aria-label`s override the
 * text, so a name lookup would not notice the label changing.
 */
export function getNavLink(scope: Locator, label: string): Locator {
  return scope.getByRole('link').filter({ hasText: label });
}

export function getNavToggle(page: Page): Locator {
  return page.locator('header').getByRole('button', { name: NAV_TOGGLE_LABEL });
}
