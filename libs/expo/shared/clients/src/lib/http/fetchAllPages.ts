import { HMIS_REST_API_MAX_PER_PAGE } from './hmisClient';
import type { HmisHttpQueryParams } from './hmisTypes';

export type HmisLinkPaginatedResponse<T> = {
  items: T[];
  _links?: {
    next?: { href: string };
  };
};

export async function fetchAllPages<T>(
  fetchPage: (
    params?: HmisHttpQueryParams
  ) => Promise<HmisLinkPaginatedResponse<T>>
): Promise<T[]> {
  const allItems: T[] = [];

  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetchPage({
      page,
      per_page: HMIS_REST_API_MAX_PER_PAGE,
    });

    allItems.push(...response.items);

    // relying on next link for determining next page
    hasNextPage = Boolean(response._links?.next);

    if (!hasNextPage) {
      return allItems;
    }

    page += 1;
  }

  return allItems;
}
