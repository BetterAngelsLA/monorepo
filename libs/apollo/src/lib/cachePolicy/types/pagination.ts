import { PaginationModeEnum } from '../constants';

export type OffsetPaginationVariables = {
  mode: PaginationModeEnum.Offset;
  offsetPath: string | readonly string[];
  limitPath: string | readonly string[];
};

export type TPaginationVariables = OffsetPaginationVariables;
