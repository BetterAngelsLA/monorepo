import { DEFAULT_OFFSET_PAGINATION } from '../../constants';
import { PaginationVars } from '../../merge/types';
import { TPaginationVariables } from '../../types';
import { extractOffsetPagination } from './extractOffsetPagination';
import { extractPerPagePagination } from './extractPerPagePagination';

export function extractPagination<T = string>(
  variables: unknown,
  paginationVars?: TPaginationVariables
): PaginationVars | undefined {
  if (!variables) {
    return undefined;
  }

  const pagination = paginationVars || DEFAULT_OFFSET_PAGINATION;

  const { mode } = pagination;

  if (mode === 'perPage') {
    const { pagePath, perPagePath } = pagination;

    return extractPerPagePagination<T>({ variables, pagePath, perPagePath });
  }

  const { offsetPath, limitPath } = pagination;

  return extractOffsetPagination<T>({ variables, offsetPath, limitPath });
}
