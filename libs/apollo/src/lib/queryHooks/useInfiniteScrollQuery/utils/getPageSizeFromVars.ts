import type { OperationVariables } from '@apollo/client';
import { PaginationModeEnum } from '../../../cachePolicy';
import { readAtPath } from '../../../utils';

type TProps<TVars> = {
  paginationMode: PaginationModeEnum | undefined;
  baseVariables: TVars | undefined;
  fallback: number;
  paginationPerPagePath?: string | readonly string[];
  paginationLimitPath?: string | readonly string[];
};

export function getPageSizeFromVars<TVars extends OperationVariables>(
  props: TProps<TVars>
): number {
  const {
    paginationMode,
    baseVariables,
    fallback,
    paginationPerPagePath,
    paginationLimitPath,
  } = props;

  if (paginationMode === PaginationModeEnum.PerPage) {
    const perPage = readAtPath<number>(baseVariables, paginationPerPagePath);

    if (typeof perPage === 'number' && perPage > 0) {
      return perPage;
    }
  }

  if (paginationMode === PaginationModeEnum.Offset) {
    const limit = readAtPath<number>(baseVariables, paginationLimitPath);

    if (typeof limit === 'number' && limit > 0) {
      return limit;
    }
  }

  return fallback;
}
