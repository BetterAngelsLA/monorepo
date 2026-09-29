import type { OperationVariables } from '@apollo/client';
import { PaginationModeEnum } from '../../../cachePolicy';
import { withValueAtPath } from '../../../utils';
import { readNumberAtPathOr } from '../../../utils/readNumberAtPathOr';

type TNextPageOffset<TVars> = {
  previousVariables: TVars | undefined;
  incrementBy: number; // how many we want to fetch next
  paginationMode: PaginationModeEnum.Offset;
  paginationOffsetPath: string | readonly string[];
  paginationLimitPath: string | readonly string[];
};

// PER-PAGE version
type TNextPagePerPage<TVars> = {
  previousVariables: TVars | undefined;
  incrementBy: number; // how many we want to fetch next
  paginationMode: PaginationModeEnum.PerPage;
  paginationPagePath: string | readonly string[];
  paginationPerPagePath: string | readonly string[];
};

type TNextPageProps<TVars> = TNextPageOffset<TVars> | TNextPagePerPage<TVars>;

export function buildVariablesForPage<TVars extends OperationVariables>(
  args: TNextPageProps<TVars>,
): TVars {
  const { previousVariables, paginationMode, incrementBy } = args;

  // `withValueAtPath` returns a new variables object and copies only the
  // containers along the written path, so nested objects shared with the
  // previous variables (e.g. the hook's page-1 variables used by reload())
  // are never mutated.
  let nextVars: Record<string, unknown> = previousVariables
    ? (previousVariables as Record<string, unknown>)
    : {};

  // offset/limit
  if (paginationMode === PaginationModeEnum.Offset) {
    const { paginationOffsetPath, paginationLimitPath } = args;

    const prevOffset = readNumberAtPathOr({
      source: nextVars,
      path: paginationOffsetPath,
      fallback: 0,
      min: 0,
    });

    nextVars = withValueAtPath(
      nextVars,
      paginationOffsetPath,
      prevOffset + incrementBy,
    );
    nextVars = withValueAtPath(nextVars, paginationLimitPath, incrementBy);

    return nextVars as TVars;
  }

  // PerPage
  // figure out perPage: existing value at path or "limit"
  const { paginationPagePath, paginationPerPagePath } = args;

  const currentPage = readNumberAtPathOr({
    source: nextVars,
    path: paginationPagePath,
    fallback: 1,
    min: 1,
  });

  nextVars = withValueAtPath(nextVars, paginationPerPagePath, incrementBy);
  nextVars = withValueAtPath(nextVars, paginationPagePath, currentPage + 1);

  return nextVars as TVars;
}
