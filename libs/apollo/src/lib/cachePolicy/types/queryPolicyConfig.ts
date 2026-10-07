import { PaginationModeEnum } from '../constants';
import { OffsetPaginationVariables } from './pagination';

type PathLike = string | readonly string[];

export type QueryPolicyConfigInput = {
  itemsPath?: PathLike;
  totalCountPath?: PathLike;
  paginationMode?: PaginationModeEnum;
  paginationVariables?: Partial<OffsetPaginationVariables>;
};

export type QueryPolicyConfig = {
  itemsPath: readonly string[];
  totalCountPath?: readonly string[];
  paginationMode: PaginationModeEnum.Offset;
  paginationOffsetPath: readonly string[];
  paginationLimitPath: readonly string[];
};
