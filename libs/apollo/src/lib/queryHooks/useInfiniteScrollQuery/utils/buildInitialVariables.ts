import type { OperationVariables } from '@apollo/client';
import {
  DEFAULT_PAGINATION_LIMIT_PATH,
  DEFAULT_PAGINATION_OFFSET_PATH,
  DEFAULT_PAGINATION_PAGE_PATH,
  DEFAULT_PAGINATION_PER_PAGE_PATH,
  PaginationModeEnum,
} from '../../../cachePolicy';
import { writeAtPath } from '../../../utils';
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
  args: TProps<TVars>
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

  // clone incoming vars
  const variables: any = baseVariables ? { ...baseVariables } : {};

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

    writeAtPath(variables, paginationPagePath, pageToUse);
    writeAtPath(variables, paginationPerPagePath, perPageToUse);

    return variables;
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

  writeAtPath(variables, paginationOffsetPath, offsetToUse);
  writeAtPath(variables, paginationLimitPath, limitToUse);

  return variables;
}
