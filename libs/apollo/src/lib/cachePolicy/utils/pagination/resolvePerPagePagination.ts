import {
  DEFAULT_PER_PAGE_PAGINATION_VARS,
  PaginationModeEnum,
} from '../../constants';
import { MergePaginationArgs } from '../../merge/types';
import { PerPagePaginationVariables } from '../../types';
import { extractPagination } from './extractPagination';

export function resolvePerPagePagination(
  variables: unknown,
  config: PerPagePaginationVariables = DEFAULT_PER_PAGE_PAGINATION_VARS
): MergePaginationArgs {
  const pagination = extractPagination(variables, config);

  if (pagination?.mode !== PaginationModeEnum.PerPage) {
    return { offset: 0, limit: 0 };
  }

  const { page, perPage } = pagination;

  if (perPage <= 0) {
    return { offset: 0, limit: 0 };
  }

  const offset = (page - 1) * perPage;

  return {
    offset,
    limit: perPage,
  };
}
