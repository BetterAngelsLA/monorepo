import type { FieldFunctionOptions } from '@apollo/client';

export type PageVars = { offset?: number; limit?: number };
export type AdaptArgs<TVars> = (vars: TVars | undefined) => PageVars;

export type BaseMergeOpts<TVars> = {
  /** Optional adapter to extract { offset, limit } from your query variables */
  adaptArgs?: AdaptArgs<TVars>;
};

export type WrapperMode<TItem, TVars> = BaseMergeOpts<TVars> & {
  mode?: 'wrapper';
  resultsKey?: string;
  totalKey?: string;
  pageInfoKey?: string;
  mergeItemOpts?: {
    getId?: (
      item: TItem,
      readField: FieldFunctionOptions['readField']
    ) => string | number | null | undefined;
  };
};

export type ArrayMode<TVars> = BaseMergeOpts<TVars> & {
  mode: 'array';
};

export type TCacheMergeOpts<TItem, TVars> =
  | WrapperMode<TItem, TVars>
  | ArrayMode<TVars>;
