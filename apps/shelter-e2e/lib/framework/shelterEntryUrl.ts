import { test } from '@playwright/test';

/**
 * A URL on the site under test, with an optional fragment.
 *
 * `page.goto('/#…')` resolves against the **origin**, not the configured
 * `baseURL` — on a branch preview served at `/branches/<branch>/` that silently
 * opened the site root instead, so a spec could pass or fail against a
 * deployment it was not meant to be testing.
 */
export function shelterEntryUrl(hash?: string): string {
  const url = new URL(
    test.info().project.use.baseURL ?? 'http://localhost:8083/',
  );

  if (hash) url.hash = hash;

  return url.toString();
}
