import type { OperationVariables } from '@apollo/client';
import { withValueAtPath } from '../../../utils';
import { readNumberAtPathOr } from '../../../utils/readNumberAtPathOr';

type TNextPageProps<TVars> = {
  previousVariables: TVars | undefined;
  incrementBy: number; // how many we want to fetch next
  /** Explicit cursor for the next page. Defaults to previous offset + incrementBy. */
  nextOffset?: number;
  paginationOffsetPath: string | readonly string[];
  paginationLimitPath: string | readonly string[];
};

export function buildVariablesForPage<TVars extends OperationVariables>(
  args: TNextPageProps<TVars>,
): TVars {
  const {
    previousVariables,
    incrementBy,
    nextOffset,
    paginationOffsetPath,
    paginationLimitPath,
  } = args;

  // `withValueAtPath` returns a new variables object and copies only the
  // containers along the written path, so nested objects shared with the
  // previous variables (e.g. the hook's page-1 variables used by reload())
  // are never mutated.
  let nextVars: Record<string, unknown> = previousVariables
    ? (previousVariables as Record<string, unknown>)
    : {};

  const prevOffset = readNumberAtPathOr({
    source: nextVars,
    path: paginationOffsetPath,
    fallback: 0,
    min: 0,
  });

  nextVars = withValueAtPath(
    nextVars,
    paginationOffsetPath,
    nextOffset ?? prevOffset + incrementBy,
  );
  nextVars = withValueAtPath(nextVars, paginationLimitPath, incrementBy);

  return nextVars as TVars;
}
