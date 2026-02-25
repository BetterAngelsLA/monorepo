import { PaginationModeEnum } from '../../constants';
import { MergePaginationArgs } from '../../merge/types';
import { TPaginationVariables } from '../../types';
import { extractPagination } from './extractPagination';
import { resolveOffsetPagination } from './resolveOffsetPagination';
import { resolvePerPagePagination } from './resolvePerPagePagination';

export function resolvePaginationFromVars<TVars = unknown>(
  variables: TVars | undefined,
  paginationVars?: TPaginationVariables
): MergePaginationArgs {
  if (!paginationVars) {
    // auto-detect with default paths
    const pagination = extractPagination(variables);

    if (pagination?.mode === PaginationModeEnum.PerPage) {
      return resolvePerPagePagination(variables);
    }

    return resolveOffsetPagination(variables);
  }

  // use provided vars
  const { mode } = paginationVars;

  if (mode === PaginationModeEnum.PerPage) {
    return resolvePerPagePagination(variables, paginationVars);
  }

  return resolveOffsetPagination(variables, paginationVars);
}
