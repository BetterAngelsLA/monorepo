import type { Page } from '@playwright/test';
import type { NavTarget } from '../constants';

/**
 * Internal routes match as a suffix because deployed builds are served from
 * `/branches/<branch>/`; absolute targets match exactly.
 *
 * Home is the base path itself, which React Router renders without its trailing
 * slash (`/branches/<branch>`, `/` at the root), so its expectation is read from
 * `document.baseURI` rather than restated here.
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
