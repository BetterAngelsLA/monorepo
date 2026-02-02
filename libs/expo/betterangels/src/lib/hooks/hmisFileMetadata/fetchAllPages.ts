import * as R from 'remeda';

interface PaginatedResponse<T> {
  items?: T[] | null;
  _meta?: {
    current_page: number;
    page_count?: number;
  };
}

/**
 * Fetches all pages of a paginated API resource in parallel.
 *
 * It first fetches page 1 to determine the total page count, then fetches
 * all remaining pages concurrently using Promise.all.
 *
 * @param fetchPageFn - Function that returns a promise for a specific page
 * @returns A promise resolving to an array of all aggregated items
 */
export async function fetchAllPages<T>(
  fetchPageFn: (page: number) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  // 1. Fetch first page to get metadata
  const firstPageRes = await fetchPageFn(1);
  const allItems: T[] = firstPageRes.items ?? [];
  const pageCount = firstPageRes._meta?.page_count ?? 1;

  if (pageCount <= 1) {
    return allItems;
  }

  // 2. Fetch remaining pages in parallel
  const responses = await Promise.all(
    R.range(2, pageCount + 1).map(fetchPageFn)
  );

  // 3. Aggregate results
  const additionalItems = R.flatMap(responses, (res) => res.items ?? []);
  return [...allItems, ...additionalItems];
}
