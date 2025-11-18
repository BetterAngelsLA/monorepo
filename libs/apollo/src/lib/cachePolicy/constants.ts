import { OffsetPaginationVariables, PerPagePaginationVariables } from './types';

// Unique symbol to store policies as metadata on the cache instance
export const TYPE_POLICIES_SYM = Symbol('typePolicies');

export const DEFAULT_QUERY_PAGE_SIZE = 25;

export const DEFAULT_QUERY_ID_KEY = 'id' as const;
export const DEFAULT_QUERY_RESULTS_KEY = 'results' as const;
export const DEFAULT_QUERY_TOTAL_COUNT_KEY = 'totalCount' as const;

// merge
export enum MergeModeEnum {
  Array = 'ARRAY',
  Object = 'OBJECT',
}

// pagination
export enum PaginationModeEnum {
  PerPage = 'PER_PAGE',
  Offset = 'OFFSET',
}

// pagination: keys
export const DEFAULT_PAGINATION_PARENT_KEY = 'pagination' as const;
export const DEFAULT_PAGINATION_OFFSET_KEY = 'offset' as const;
export const DEFAULT_PAGINATION_LIMIT_KEY = 'limit' as const;
export const DEFAULT_PAGINATION_PAGE_KEY = 'page' as const;
export const DEFAULT_PAGINATION_PER_PAGE_KEY = 'perPage' as const;

// pagination: paths
export const DEFAULT_PAGINATION_OFFSET_PATH = [
  DEFAULT_PAGINATION_PARENT_KEY,
  DEFAULT_PAGINATION_OFFSET_KEY,
] as const;
export const DEFAULT_PAGINATION_LIMIT_PATH = [
  DEFAULT_PAGINATION_PARENT_KEY,
  DEFAULT_PAGINATION_LIMIT_KEY,
] as const;
export const DEFAULT_PAGINATION_PAGE_PATH = [
  DEFAULT_PAGINATION_PARENT_KEY,
  DEFAULT_PAGINATION_PAGE_KEY,
] as const;
export const DEFAULT_PAGINATION_PER_PAGE_PATH = [
  DEFAULT_PAGINATION_PARENT_KEY,
  DEFAULT_PAGINATION_PER_PAGE_KEY,
] as const;

// pagination: vars
export const DEFAULT_OFFSET_PAGINATION_VARS: OffsetPaginationVariables = {
  mode: PaginationModeEnum.Offset,
  offsetPath: DEFAULT_PAGINATION_OFFSET_PATH,
  limitPath: DEFAULT_PAGINATION_LIMIT_PATH,
};

export const DEFAULT_PER_PAGE_PAGINATION_VARS: PerPagePaginationVariables = {
  mode: PaginationModeEnum.PerPage,
  pagePath: DEFAULT_PAGINATION_PAGE_PATH,
  perPagePath: DEFAULT_PAGINATION_PER_PAGE_PATH,
};
