import type { OperationVariables } from '@apollo/client';
import { withValueAtPath } from '../../../utils';

type TNextPageProps<TVars> = {
  /** Variables of the first page; everything except the cursor is carried over. */
  baseVariables: TVars | undefined;
  /** Cursor for the page being requested: the number of items already in the list. */
  offset: number;
  /** How many items the page may contain (becomes the limit). */
  pageSize: number;
  paginationOffsetPath: string | readonly string[];
  paginationLimitPath: string | readonly string[];
};

export function buildVariablesForPage<TVars extends OperationVariables>(
  args: TNextPageProps<TVars>,
): TVars {
  const {
    baseVariables,
    offset,
    pageSize,
    paginationOffsetPath,
    paginationLimitPath,
  } = args;

  // `withValueAtPath` returns a new variables object and copies only the
  // containers along the written path, so nested objects shared with the
  // base variables (e.g. the page-1 variables used by reload()) are never
  // mutated.
  const base: Record<string, unknown> = baseVariables
    ? (baseVariables as Record<string, unknown>)
    : {};

  const withOffset = withValueAtPath(base, paginationOffsetPath, offset);
  const nextVars = withValueAtPath(withOffset, paginationLimitPath, pageSize);

  return nextVars as TVars;
}
