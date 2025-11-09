import {
  DEFAULT_OFFSET_PAGINATION_VARS,
  PaginationModeEnum,
} from '../../constants';
import { PaginationVars } from '../../merge/types';
import { TPaginationVariables } from '../../types';
import { extractOffsetPagination } from './extractOffsetPagination';
import { extractPerPagePagination } from './extractPerPagePagination';

export function extractPagination(
  variables: unknown,
  paginationVars?: TPaginationVariables
): PaginationVars | undefined {
  if (!variables) {
    return undefined;
  }

  const pagination = paginationVars || DEFAULT_OFFSET_PAGINATION_VARS;

  const { mode } = pagination;

  if (mode === PaginationModeEnum.PerPage) {
    const { pagePath, perPagePath } = pagination;

    return extractPerPagePagination({ variables, pagePath, perPagePath });
  }

  const { offsetPath, limitPath } = pagination;

  return extractOffsetPagination({ variables, offsetPath, limitPath });
}
