import { extractPagination } from '../../../utils';
import {
  createOffsetPaginationResolver,
  createPerPagePaginationResolver,
} from '../../resolvers';
import type { MergePaginationArgs } from '../../types';

/**
 * Fallback resolver when:
 * - mergeOpts did not provide resolvePaginationFn
 * - caller did not provide paginationVariables
 *
 * Tries to detect perPage vs offset from variables.
 */
export function defaultPaginationResolverFn<TVars = unknown>(
  variables: TVars | undefined
): MergePaginationArgs {
  const perPageResolver = createPerPagePaginationResolver<TVars>();
  const offsetResolver = createOffsetPaginationResolver<TVars>();

  const pagination = extractPagination(variables);

  if (pagination && pagination.type === 'perPage') {
    return perPageResolver(variables);
  }

  return offsetResolver(variables);
}
