// -------------------- Pagination -------------------- //
export type OffsetPaginationVars = {
  type: 'offset';
  offset: number;
  limit: number;
};

export type PerPagePaginationVars = {
  type: 'perPage';
  page: number;
  perPage: number;
};

export type PaginationVars = PerPagePaginationVars | OffsetPaginationVars;

export type MergePaginationArgs = { offset: number; limit: number };

// -------------------- Other -------------------- //

/** Read variables and return the effective { offset, limit } for merging. */
export type ResolveMergePagination<TVars> = (
  variables: TVars | undefined
) => MergePaginationArgs;

/** Normalize the incoming payload before merging (e.g., lift meta.totalCount → total). */
export type TransformIncoming = (incomingValue: unknown) => unknown;

export type BaseMergeOpts<TVars> = {
  /** Adapter to extract { offset, limit } from query variables. */
  resolvePaginationFn?: ResolveMergePagination<TVars>;

  /** Optional normalizer to reshape the incoming payload prior to merging. */
  transformIncoming?: TransformIncoming;
};

export type WrapperMode<TVars> = BaseMergeOpts<TVars> & {
  mode?: 'wrapper';

  // data paths
  itemsPath?: string | ReadonlyArray<string>;
  totalCountPath?: string | ReadonlyArray<string>;
  itemIdPath?: string | ReadonlyArray<string>;

  // pagination
  resolvePaginationFn?: ResolveMergePagination<TVars>;
};

export type ArrayMode<TVars> = BaseMergeOpts<TVars> & {
  mode: 'array';
};

export type TCacheMergeOpts<TVars> = WrapperMode<TVars> | ArrayMode<TVars>;
