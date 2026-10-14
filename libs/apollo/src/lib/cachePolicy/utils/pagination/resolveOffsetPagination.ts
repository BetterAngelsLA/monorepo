import { DEFAULT_OFFSET_PAGINATION_VARS } from '../../constants';
import { MergePaginationArgs } from '../../merge/types';
import { OffsetPaginationVariables } from '../../types';
import { extractOffsetPagination } from './extractOffsetPagination';

/**
 * Core resolver: variables + a known offset-style config → { offset, limit }
 */
export function resolveOffsetPagination(
  variables: unknown,
  config: OffsetPaginationVariables = DEFAULT_OFFSET_PAGINATION_VARS,
): MergePaginationArgs {
  const pagination = extractOffsetPagination({
    variables,
    offsetPath: config.offsetPath,
    limitPath: config.limitPath,
  });

  if (!pagination) {
    return { offset: 0, limit: 0 };
  }

  return {
    offset: pagination.offset,
    limit: pagination.limit,
  };
}
