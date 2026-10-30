import type { Page } from '@playwright/test';
import { postGraphQL } from '../postGraphQL';

const PUBLIC_SHELTERS_QUERY = `
  query PublicShelters(
    $filters: PublicShelterFilter
    $pagination: OffsetPaginationInput
  ) {
    shelters(filters: $filters, pagination: $pagination) {
      totalCount
      results {
        id
        name
      }
    }
  }
`;

export type TMapBounds = {
  westLng: number;
  northLat: number;
  eastLng: number;
  southLat: number;
};

export type TSheltersQuery = {
  mapBounds?: TMapBounds;
  name?: string;
};

export type TSheltersPayload = {
  totalCount: number;
  results: { id: string; name: string }[];
};

/** The server's answer for `filters` — the value the panel is compared against. */
export async function fetchShelters(
  page: Page,
  filters: TSheltersQuery = {},
): Promise<TSheltersPayload> {
  const data = await postGraphQL<{ shelters: TSheltersPayload }>(
    page,
    PUBLIC_SHELTERS_QUERY,
    {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      pagination: { limit: 5000, offset: 0 },
    },
  );

  return data.shelters;
}
