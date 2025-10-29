import type { ResolveMergePagination } from '../types';

/**
 * For APIs that use { pagination: { page, perPage } }
 */
export function resolvePerPagePagination<
  TVars = any
>(): ResolveMergePagination<TVars> {
  return function convertPerPageVars(variables: any) {
    const page = Number(variables?.pagination?.page) || 1;
    const perPage = Number(variables?.pagination?.perPage) || 0;

    if (perPage <= 0) {
      return { offset: 0, limit: 0 };
    }

    const offset = (page - 1) * perPage;

    return { offset, limit: perPage };
  };
}
