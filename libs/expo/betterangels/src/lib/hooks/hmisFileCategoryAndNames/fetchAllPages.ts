import {
  HMIS_REST_API_MAX_PER_PAGE,
  type HmisHttpQueryParams,
} from '@monorepo/expo/shared/clients';

type HmisPaginatedResponse<T> = {
  items: T[];
  _links?: {
    next?: { href: string };
  };
};

export async function fetchAllPages<T>(
  fetchPage: (params?: HmisHttpQueryParams) => Promise<HmisPaginatedResponse<T>>
): Promise<T[]> {
  const allItems: T[] = [];

  let page = 1;

  while (true) {
    const response = await fetchPage({
      page,
      per_page: HMIS_REST_API_MAX_PER_PAGE,
    });

    allItems.push(...response.items);

    if (!response._links?.next) {
      return allItems; // exit
    }

    page += 1;
  }
}
