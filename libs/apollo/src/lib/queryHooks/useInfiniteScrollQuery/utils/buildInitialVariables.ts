import type { OperationVariables } from '@apollo/client';
import {
  DEFAULT_PAGINATION_LIMIT_PATH,
  DEFAULT_PAGINATION_OFFSET_PATH,
  DEFAULT_PAGINATION_PAGE_PATH,
  DEFAULT_PAGINATION_PER_PAGE_PATH,
  PaginationModeEnum,
} from '../../../cachePolicy';
import { withValueAtPath } from '../../../utils';
import { readNumberAtPathOr } from '../../../utils/readNumberAtPathOr';

type TProps<TVars> = {
  baseVariables: TVars | undefined;
  paginationMode: PaginationModeEnum | undefined;
  pageSize: number;
  paginationOffsetPath?: string | readonly string[];
  paginationLimitPath?: string | readonly string[];
  paginationPagePath?: string | readonly string[];
  paginationPerPagePath?: string | readonly string[];
};

export function buildInitialVariables<TVars extends OperationVariables>(
  args: TProps<TVars>,
): TVars {
  const {
    baseVariables,
    paginationMode = PaginationModeEnum.Offset,
    pageSize,
    paginationOffsetPath = DEFAULT_PAGINATION_OFFSET_PATH,
    paginationLimitPath = DEFAULT_PAGINATION_LIMIT_PATH,
    paginationPagePath = DEFAULT_PAGINATION_PAGE_PATH,
    paginationPerPagePath = DEFAULT_PAGINATION_PER_PAGE_PATH,
  } = args;

  // Normalize pagination fields without mutating the caller's variables:
  // `withValueAtPath` returns a new object and only copies the containers
  // along the written path (everything else keeps its identity).
  let variables: Record<string, unknown> = baseVariables
    ? (baseVariables as Record<string, unknown>)
    : {};

  // Always start from the first page: the merge layer places items at their
  // server offsets, so a non-zero starting page/offset would leave
  // `undefined` holes — and a hole makes the cache field unreadable.
  // Any caller-provided starting page/offset is ignored.

  // page/perPage shape
  if (paginationMode === PaginationModeEnum.PerPage) {
    const perPageToUse = readNumberAtPathOr({
      source: variables,
      path: paginationPerPagePath,
      fallback: pageSize,
      min: 1,
    });

    variables = withValueAtPath(variables, paginationPagePath, 1);
    variables = withValueAtPath(variables, paginationPerPagePath, perPageToUse);

    return variables as TVars;
  }

  // offset/limit (default)
  const limitToUse = readNumberAtPathOr({
    source: variables,
    path: paginationLimitPath,
    fallback: pageSize,
    min: 1,
  });

  variables = withValueAtPath(variables, paginationOffsetPath, 0);
  variables = withValueAtPath(variables, paginationLimitPath, limitToUse);

  return variables as TVars;
}
