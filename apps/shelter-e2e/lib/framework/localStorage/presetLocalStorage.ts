import type { Page } from '@playwright/test';

/**
 * Seeds `localStorage` for the **next** navigation: `addInitScript` runs ahead of
 * the page's own scripts, so a component that reads a key in its first render
 * already sees it.
 */
export async function presetLocalStorage(
  page: Page,
  entries: Record<string, string>,
): Promise<void> {
  await page.addInitScript((values) => {
    for (const [key, value] of Object.entries(values)) {
      window.localStorage.setItem(key, value);
    }
  }, entries);
}
