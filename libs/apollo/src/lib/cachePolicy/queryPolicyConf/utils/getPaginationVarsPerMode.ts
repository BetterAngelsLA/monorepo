import {
  DEFAULT_OFFSET_PAGINATION_VARS,
  DEFAULT_PER_PAGE_PAGINATION_VARS,
  PaginationModeEnum,
} from '../../constants';
import {
  OffsetPaginationVariables,
  PerPagePaginationVariables,
  TPaginationVariables,
} from '../../types';

export function getPaginationVarsPerMode(
  paginationMode: PaginationModeEnum,
  paginationVariables?: Partial<TPaginationVariables>
): TPaginationVariables {
  if (paginationMode === PaginationModeEnum.PerPage) {
    const { pagePath } = (paginationVariables ||
      {}) as PerPagePaginationVariables;

    return {
      mode: PaginationModeEnum.PerPage,
      pagePath: pagePath ?? DEFAULT_PER_PAGE_PAGINATION_VARS.pagePath,
      perPagePath: pagePath ?? DEFAULT_PER_PAGE_PAGINATION_VARS.perPagePath,
    };
  }

  const { offsetPath, limitPath } = (paginationVariables ||
    {}) as OffsetPaginationVariables;

  return {
    mode: PaginationModeEnum.Offset,
    offsetPath: offsetPath ?? DEFAULT_OFFSET_PAGINATION_VARS.offsetPath,
    limitPath: limitPath ?? DEFAULT_OFFSET_PAGINATION_VARS.limitPath,
  };
}
