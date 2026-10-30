import type { Locator, Page } from '@playwright/test';

/**
 * Matched by pattern because the pre-search state renders "0 locations" with no
 * total.
 */
export function getResultCount(page: Page): Locator {
  return page
    .getByText(/^\d+( of \d+)? locations?$/)
    .filter({ visible: true })
    .first();
}

/** The "(based on ...)" line under the count. */
export function getResultsSource(page: Page): Locator {
  return page
    .getByText(/\(based on .* area\)/)
    .filter({ visible: true })
    .first();
}

/** A shelter card, addressed by the name it shows. */
export function getShelterCard(page: Page, name: string): Locator {
  return page
    .getByText(name, { exact: true })
    .filter({ visible: true })
    .first();
}

/** The list's empty state, shown when a response carries no results. */
export function getEmptyList(page: Page): Locator {
  return page.getByText('No results').filter({ visible: true }).first();
}
