/** Minimal pagination shape you might extract from variables */
export type PageVars = { offset?: number | null; limit?: number | null };

/** Map your query variables to { offset, limit } */
export type AdaptArgs<TVars = unknown> = (vars: TVars | undefined) => PageVars;

/** Default: read from vars.pagination.{offset,limit} */
function defaultAdapt<TVars = unknown>(vars: TVars | undefined): PageVars {
  return (
    (vars as unknown as { pagination?: PageVars } | undefined)?.pagination ?? {}
  );
}

/** Common options shared by both modes */
export type CommonOpts<TVars> = {
  adaptArgs?: AdaptArgs<TVars>;
};

/** Field is a plain array (e.g., users(): User[]) */
export type ArrayMode<TVars> = CommonOpts<TVars> & {
  mode: 'array';
};

/** Field is a wrapper object (default), e.g. { results, totalCount, pageInfo } */
export type WrapperMode<TVars> = CommonOpts<TVars> & {
  mode?: 'wrapper';
  resultsKey?: string;
  totalKey?: string;
  pageInfoKey?: string;
};

/** Discriminated union of merge options */
export type TCacheMergeOpts<TVars = unknown> =
  | ArrayMode<TVars>
  | WrapperMode<TVars>;
