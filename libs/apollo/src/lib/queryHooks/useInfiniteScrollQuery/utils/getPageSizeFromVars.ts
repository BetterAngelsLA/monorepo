import type { OperationVariables } from '@apollo/client';
import { readAtPath } from '../../../utils';

type TProps<TVars> = {
  baseVariables: TVars | undefined;
  fallback: number;
  paginationLimitPath?: string | readonly string[];
};

/** Reads the current page size (limit) from the variables, else the fallback. */
export function getPageSizeFromVars<TVars extends OperationVariables>(
  props: TProps<TVars>,
): number {
  const { baseVariables, fallback, paginationLimitPath } = props;

  const limit = readAtPath<number>(baseVariables, paginationLimitPath);

  if (typeof limit === 'number' && limit > 0) {
    return limit;
  }

  return fallback;
}
