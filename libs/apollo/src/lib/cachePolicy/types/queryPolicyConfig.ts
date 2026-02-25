import { PaginationModeEnum } from '../constants';
import { TPaginationVariables } from './pagination';

type PathLike = string | readonly string[];

export type QueryPolicyConfigInput = {
  itemsPath?: PathLike;
  totalCountPath?: PathLike;
  paginationMode?: PaginationModeEnum;
  paginationVariables?: Partial<TPaginationVariables>;
};

export type QueryPolicyConfig =
  | {
      itemsPath: readonly string[];
      totalCountPath?: readonly string[];
      // offset/limit pagination:
      paginationMode: PaginationModeEnum.Offset;
      paginationOffsetPath: readonly string[];
      paginationLimitPath: readonly string[];
      // not used
      paginationPagePath?: never;
      paginationPerPagePath?: never;
    }
  | {
      itemsPath: readonly string[];
      totalCountPath?: readonly string[];
      // pag/perPage pagination :
      paginationMode: PaginationModeEnum.PerPage;
      paginationPagePath: readonly string[];
      paginationPerPagePath: readonly string[];
      // not
      paginationOffsetPath?: never;
      paginationLimitPath?: never;
    };
