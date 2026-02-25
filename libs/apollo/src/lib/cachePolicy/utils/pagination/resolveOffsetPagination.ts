import {
  DEFAULT_OFFSET_PAGINATION_VARS,
  PaginationModeEnum,
} from '../../constants';
import { MergePaginationArgs } from '../../merge/types';
import { OffsetPaginationVariables } from '../../types';
import { extractPagination } from './extractPagination';

/**
 * Core resolver: variables + a known offset-style config → { offset, limit }
 */
export function resolveOffsetPagination(
  variables: unknown,
  config: OffsetPaginationVariables = DEFAULT_OFFSET_PAGINATION_VARS
): MergePaginationArgs {
  const pagination = extractPagination(variables, config);

  if (pagination?.mode !== PaginationModeEnum.Offset) {
    return { offset: 0, limit: 0 };
  }

  const { offset, limit } = pagination;

  return {
    offset,
    limit,
  };
}
