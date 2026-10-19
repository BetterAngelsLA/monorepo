import type { OperationVariables } from '@apollo/client';
import {
  DEFAULT_PAGINATION_LIMIT_PATH,
  DEFAULT_PAGINATION_OFFSET_PATH,
} from '../../../cachePolicy';
import { withValueAtPath } from '../../../utils';
import { readNumberAtPathOr } from '../../../utils/readNumberAtPathOr';

type TProps<TVars> = {
  baseVariables: TVars | undefined;
  pageSize: number;
  paginationOffsetPath?: string | readonly string[];
  paginationLimitPath?: string | readonly string[];
};

export function buildInitialVariables<TVars extends OperationVariables>(
  args: TProps<TVars>,
): TVars {
  const {
    baseVariables,
    pageSize,
    paginationOffsetPath = DEFAULT_PAGINATION_OFFSET_PATH,
    paginationLimitPath = DEFAULT_PAGINATION_LIMIT_PATH,
  } = args;

  // Normalize pagination fields without mutating the caller's variables:
  // `withValueAtPath` returns a new object and only copies the containers
  // along the written path (everything else keeps its identity).
  let variables: Record<string, unknown> = baseVariables
    ? (baseVariables as Record<string, unknown>)
    : {};

  // Always start from the first page: the merge layer places items at their
  // server offsets, so a non-zero starting offset would leave `undefined`
  // holes — and a hole makes the cache field unreadable. Any caller-provided
  // starting offset is ignored.
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
