import { readAtPath, toNonNegativeIntegerOrFallback } from '../../../utils';
import {
  DEFAULT_PAGINATION_LIMIT_PATH,
  DEFAULT_PAGINATION_OFFSET_PATH,
  PaginationModeEnum,
} from '../../constants';
import { PaginationVars } from '../../merge/types';

type TExtractOffsetPagination = {
  variables: unknown;
  offsetPath?: string | ReadonlyArray<string>;
  limitPath?: string | ReadonlyArray<string>;
};

export function extractOffsetPagination(
  opts: TExtractOffsetPagination
): PaginationVars | undefined {
  const { variables, offsetPath, limitPath } = opts;

  const offset = readAtPath(
    variables,
    offsetPath || DEFAULT_PAGINATION_OFFSET_PATH
  );
  const limit = readAtPath(
    variables,
    limitPath || DEFAULT_PAGINATION_LIMIT_PATH
  );

  return {
    mode: PaginationModeEnum.Offset,
    offset: toNonNegativeIntegerOrFallback(offset, 0),
    limit: toNonNegativeIntegerOrFallback(limit, 0),
  };
}
