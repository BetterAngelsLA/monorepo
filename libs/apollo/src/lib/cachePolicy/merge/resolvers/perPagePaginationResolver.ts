import { DEFAULT_PER_PAGE_PAGINATION } from '../../constants';
import { PerPagePaginationVariables } from '../../types';
import { extractPagination } from '../../utils';
import { MergePaginationArgs, ResolveMergePagination } from '../types';

export function createPerPagePaginationResolver<TVars = unknown>(
  config?: PerPagePaginationVariables
): ResolveMergePagination<TVars> {
  const effectiveConfig =
    config && config.mode === 'perPage' ? config : DEFAULT_PER_PAGE_PAGINATION;

  return function perPagePaginationResolver(
    variables: TVars | undefined
  ): MergePaginationArgs {
    return resolvePerPagePagination(variables, effectiveConfig);
  };
}

export function resolvePerPagePagination(
  variables: unknown,
  config: PerPagePaginationVariables = DEFAULT_PER_PAGE_PAGINATION
): MergePaginationArgs {
  const pagination = extractPagination(variables, config);

  if (!pagination || pagination.type !== 'perPage') {
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
