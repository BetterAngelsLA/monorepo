import { PaginationVars } from '../../merge/types';
import { toNonNegativeIntegerOrFallback } from '../number';
import { readAtPath } from '../readAtPath';

type TExtractPerPagePagination = {
  variables: unknown;
  pagePath?: string | ReadonlyArray<string>;
  perPagePath?: string | ReadonlyArray<string>;
};

export function extractPerPagePagination<T = string>(
  opts: TExtractPerPagePagination
): PaginationVars | undefined {
  const { variables, pagePath, perPagePath } = opts;

  if (!variables) {
    return undefined;
  }

  const page = readAtPath(variables, pagePath || 'pagination.page');
  const perPage = readAtPath(variables, perPagePath || 'pagination.perPage');

  return {
    type: 'perPage',
    page: toNonNegativeIntegerOrFallback(page, 1),
    perPage: toNonNegativeIntegerOrFallback(perPage, 0),
  };
}
