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
  // The config always sets `baseURL`; a fallback here would quietly test a
  // different server than the run claims to be testing.
  const base = test.info().project.use.baseURL;

  if (!base) {
    throw new Error('shelter-e2e: the config must set `use.baseURL`.');
  }

  const url = new URL(base);

  if (hash) url.hash = hash;

  return url.toString();
}
