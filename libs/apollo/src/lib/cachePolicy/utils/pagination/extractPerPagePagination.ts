import { readAtPath, toNonNegativeIntegerOrFallback } from '../../../utils';
import {
  DEFAULT_PAGINATION_PAGE_PATH,
  DEFAULT_PAGINATION_PER_PAGE_PATH,
  PaginationModeEnum,
} from '../../constants';
import { PaginationVars } from '../../merge/types';

type TExtractPerPagePagination = {
  variables: unknown;
  pagePath?: string | ReadonlyArray<string>;
  perPagePath?: string | ReadonlyArray<string>;
};

export function extractPerPagePagination(
  opts: TExtractPerPagePagination
): PaginationVars | undefined {
  const { variables, pagePath, perPagePath } = opts;

  if (!variables) {
    return undefined;
  }

  const page = readAtPath(variables, pagePath || DEFAULT_PAGINATION_PAGE_PATH);
  const perPage = readAtPath(
    variables,
    perPagePath || DEFAULT_PAGINATION_PER_PAGE_PATH
  );

  return {
    mode: PaginationModeEnum.PerPage,
    page: toNonNegativeIntegerOrFallback(page, 1),
    perPage: toNonNegativeIntegerOrFallback(perPage, 0),
  };
}
