import { MergeModeEnum, PaginationModeEnum } from '../constants';

// -------------------- Pagination -------------------- //
export type OffsetPaginationVars = {
  mode: PaginationModeEnum.Offset;
  offset: number;
  limit: number;
};

export type PerPagePaginationVars = {
  mode: PaginationModeEnum.PerPage;
  page: number;
  perPage: number;
};

export type PaginationVars = PerPagePaginationVars | OffsetPaginationVars;

export type MergePaginationArgs = { offset: number; limit: number };

/** Read variables and return the effective { offset, limit } for merging. */
export type ResolveMergePagination<TVars> = (
  variables: TVars | undefined
) => MergePaginationArgs;

// -------------------- Merge -------------------- //

/** Merge mode for object-shaped payloads */
export type ObjectMergeMode = {
  mode?: MergeModeEnum.Object;

  /** where the item has its id, e.g. "personalId" */
  itemIdPath?: string | ReadonlyArray<string>;

  /** where the server puts the array, e.g. "items" or ["data", "items"] */
  itemsPath?: string | ReadonlyArray<string>;

  /** where the server puts total, e.g. ["meta", "totalCount"] */
  totalCountPath?: string | ReadonlyArray<string>;
};

export type ArrayMergeMode = {
  mode: MergeModeEnum.Array;
};

export type TCacheMergeOpts = ObjectMergeMode | ArrayMergeMode;
