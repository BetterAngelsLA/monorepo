import { TPaginationVariables } from '../../../types';
import { resolvePaginationFromVars } from '../../../utils/pagination';
import { ResolveMergePagination } from '../../types';

/**
 * Builds a pagination resolver for merge functions.
 * Always derives from variables and optional pagination config.
 */
export function generatePaginationResolver<TVars>(
  paginationVariables?: TPaginationVariables
): ResolveMergePagination<TVars> {
  return (variables: TVars | undefined) =>
    resolvePaginationFromVars(variables, paginationVariables);
}
