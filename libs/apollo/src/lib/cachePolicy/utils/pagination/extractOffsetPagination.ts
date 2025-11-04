import { PaginationVars } from '../../merge/types';
import { toNonNegativeIntegerOrFallback } from '../number';
import { readAtPath } from '../readAtPath';

type TExtractOffsetPagination = {
  variables: unknown;
  offsetPath?: string | ReadonlyArray<string>;
  limitPath?: string | ReadonlyArray<string>;
};

export function extractOffsetPagination<T = string>(
  opts: TExtractOffsetPagination
): PaginationVars | undefined {
  const { variables, offsetPath, limitPath } = opts;

  const offset = readAtPath(variables, offsetPath || 'pagination.offset');
  const limit = readAtPath(variables, limitPath || 'pagination.limit');

  return {
    type: 'offset',
    offset: toNonNegativeIntegerOrFallback(offset, 0),
    limit: toNonNegativeIntegerOrFallback(limit, 0),
  };
}
