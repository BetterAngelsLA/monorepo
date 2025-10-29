import type { FieldFunctionOptions } from '@apollo/client';

// -------------------- Pagination -------------------- //
export type OffsetPaginationVars = {
  type: 'offset';
  offset: number | string | null | undefined;
  limit: number | string | null | undefined;
};

export type PerPagePaginationVars = {
  type: 'perPage';
  page: number | string | null | undefined;
  perPage: number | string | null | undefined;
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

export type WrapperMode<TItem, TVars> = BaseMergeOpts<TVars> & {
  mode?: 'wrapper';

  // Pagination fields
  itemsFieldName?: string;
  totalFieldName?: string;
  pageInfoFieldName?: string;

  // Item-level merge behavior
  mergeItemOpts?: {
    getItemId?: (
      item: TItem,
      readField: FieldFunctionOptions['readField']
    ) => string | number | null | undefined;
  };

  // Top-level alias for convenience — hoisted internally into mergeItemOpts
  getItemId?: (
    item: TItem,
    readField: FieldFunctionOptions['readField']
  ) => string | number | null | undefined;
};

export type ArrayMode<TVars> = BaseMergeOpts<TVars> & {
  mode: 'array';
};

export type TCacheMergeOpts<TItem, TVars> =
  | WrapperMode<TItem, TVars>
  | ArrayMode<TVars>;
