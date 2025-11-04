import { DEFAULT_OFFSET_PAGINATION } from '../../constants';
import { OffsetPaginationVariables } from '../../types';
import { extractPagination } from '../../utils';
import type { MergePaginationArgs, ResolveMergePagination } from '../types';

/**
 * Factory for APIs that paginate with { pagination: { offset, limit } }
 * but may use different paths.
 *
 * If you do NOT pass a config, it will use:
 *   { mode: 'offset', offsetPath: 'pagination.offset', limitPath: 'pagination.limit' }
 */
export function createOffsetPaginationResolver<TVars = unknown>(
  config?: OffsetPaginationVariables
): ResolveMergePagination<TVars> {
  const effectiveConfig =
    config && config.mode === 'offset' ? config : DEFAULT_OFFSET_PAGINATION;

  return function offsetPaginationResolver(
    variables: TVars | undefined
  ): MergePaginationArgs {
    return resolveOffsetPagination(variables, effectiveConfig);
  };
}

/**
 * Core resolver: variables + a known offset-style config → { offset, limit }
 */
export function resolveOffsetPagination(
  variables: unknown,
  config: OffsetPaginationVariables = DEFAULT_OFFSET_PAGINATION
): MergePaginationArgs {
  const pagination = extractPagination(variables, config);

  if (!pagination || pagination.type !== 'offset') {
    return { offset: 0, limit: 0 };
  }

  const { offset, limit } = pagination;

  return {
    offset,
    limit,
  };
}
