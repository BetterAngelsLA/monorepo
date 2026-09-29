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
    paginationMode = PaginationModeEnum.PerPage,
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

  // page/perPage shape
  if (paginationMode === PaginationModeEnum.PerPage) {
    const pageToUse = readNumberAtPathOr({
      source: variables,
      path: paginationPagePath,
      fallback: 1,
      min: 1,
    });

    const perPageToUse = readNumberAtPathOr({
      source: variables,
      path: paginationPerPagePath,
      fallback: pageSize,
      min: 1,
    });

    variables = withValueAtPath(variables, paginationPagePath, pageToUse);
    variables = withValueAtPath(variables, paginationPerPagePath, perPageToUse);

    return variables as TVars;
  }

  // offset/limit (default)
  const offsetToUse = readNumberAtPathOr({
    source: variables,
    path: paginationOffsetPath,
    fallback: 0,
    min: 0,
  });

  const limitToUse = readNumberAtPathOr({
    source: variables,
    path: paginationLimitPath,
    fallback: pageSize,
    min: 1,
  });

  variables = withValueAtPath(variables, paginationOffsetPath, offsetToUse);
  variables = withValueAtPath(variables, paginationLimitPath, limitToUse);

  return variables as TVars;
}
