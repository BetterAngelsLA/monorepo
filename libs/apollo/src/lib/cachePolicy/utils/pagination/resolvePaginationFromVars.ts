import { MergePaginationArgs } from '../../merge/types';
import { OffsetPaginationVariables } from '../../types';
import { resolveOffsetPagination } from './resolveOffsetPagination';

export function resolvePaginationFromVars<TVars = unknown>(
  variables: TVars | undefined,
  paginationVars?: OffsetPaginationVariables,
): MergePaginationArgs {
  return resolveOffsetPagination(variables, paginationVars);
}
