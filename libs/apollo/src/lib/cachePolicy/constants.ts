import { OffsetPaginationVariables, PerPagePaginationVariables } from './types';

// Unique symbol to store policies as metadata on the cache instance
export const TYPE_POLICIES_SYM = Symbol('typePolicies');

export const DEFAULT_QUERY_RESULTS_KEY = 'results' as const;
export const DEFAULT_QUERY_TOTAL_COUNT_KEY = 'totalCount' as const;
export const DEFAULT_QUERY_ID_KEY = 'id' as const;

// export const DEFAULT_QUERY_ITEMS_PATH = 'totalCount' as const;
// export const DEFAULT_QUERY_TOTAL_COUNT_PATH = 'totalCount' as const;
// export const DEFAULT_QUERY_ITEM_ID_PATH = 'totalCount' as const;

// itemsPath: 'items',
// totalCountPath: ['meta', 'totalCount'],
// itemIdPath: 'personalId',
// itemsPath?: string | ReadonlyArray<string>;
// totalCountPath?: string | ReadonlyArray<string>;
// itemIdPath?: string | ReadonlyArray<string>;

export const DEFAULT_OFFSET_PAGINATION: OffsetPaginationVariables = {
  mode: 'offset',
  offsetPath: 'pagination.offset',
  limitPath: 'pagination.limit',
};

export const DEFAULT_PER_PAGE_PAGINATION: PerPagePaginationVariables = {
  mode: 'perPage',
  pagePath: 'pagination.page',
  perPagePath: 'pagination.perPage',
};
