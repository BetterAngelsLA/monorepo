import { PaginationModeEnum } from '../constants';

export type PerPagePaginationVariables = {
  mode: PaginationModeEnum.PerPage;
  // path to page, e.g. 'pagination.page' → ['pagination', 'page']
  pagePath: string | ReadonlyArray<string>;
  // path to perPage from, e.g. 'pagination.pageSize' → ['pagination', 'pageSize']
  perPagePath: string | ReadonlyArray<string>;
};

export type OffsetPaginationVariables = {
  mode: PaginationModeEnum.Offset;
  offsetPath: string | readonly string[];
  limitPath: string | readonly string[];
};

export type TPaginationVariables =
  | PerPagePaginationVariables
  | OffsetPaginationVariables;
