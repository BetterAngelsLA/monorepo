import type { OperationVariables } from '@apollo/client';
import { PaginationModeEnum } from '../../../cachePolicy';
import { readNumberAtPathOr } from '../../../utils/readNumberAtPathOr';
import { writeAtPath } from '../../../utils/writeAtPath';

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
  args: TNextPageProps<TVars>
): TVars {
  const { previousVariables, paginationMode, incrementBy } = args;

  const nextVars: any = previousVariables ? { ...previousVariables } : {};

  // offset/limit
  if (paginationMode === PaginationModeEnum.Offset) {
    const { paginationOffsetPath, paginationLimitPath } = args;

    const prevOffset = readNumberAtPathOr({
      source: nextVars,
      path: paginationOffsetPath,
      fallback: 0,
      min: 0,
    });

    writeAtPath(nextVars, paginationOffsetPath, prevOffset + incrementBy);
    writeAtPath(nextVars, paginationLimitPath, incrementBy);

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

  writeAtPath(nextVars, paginationPerPagePath, incrementBy);
  writeAtPath(nextVars, paginationPagePath, currentPage + 1); // next page

  return nextVars as TVars;
}
