import type { OperationVariables } from '@apollo/client';
import { withValueAtPath } from '../../../utils';

type TNextPageProps<TVars> = {
  /** Variables of the first page; everything — including the page limit — is carried over. */
  baseVariables: TVars;
  /** Cursor for the page being requested: the number of items already in the list. */
  offset: number;
  paginationOffsetPath: string | readonly string[];
};

/**
 * Moves the pagination cursor, keeping everything else from the base variables.
 *
 * Only the cursor changes between pages: `buildInitialVariables` resolved the
 * page limit once, and every subsequent request reuses it (Apollo's `fetchMore`
 * also merges these variables over the current ones).
 */
export function buildVariablesForPage<TVars extends OperationVariables>(
  args: TNextPageProps<TVars>,
): TVars {
  const { baseVariables, offset, paginationOffsetPath } = args;

  // `withValueAtPath` copies only the containers along the path; the base is
  // never mutated.
  return withValueAtPath(
    baseVariables as Record<string, unknown>,
    paginationOffsetPath,
    offset,
  ) as TVars;
}
