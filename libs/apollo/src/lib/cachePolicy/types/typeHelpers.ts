import {
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
} from '../constants';

export type TDefaultResultsKey = typeof DEFAULT_QUERY_RESULTS_KEY;
export type TDefaultTotalKey = typeof DEFAULT_QUERY_TOTAL_COUNT_KEY;

type ItemFromContainer<C, RK extends string> = C extends Record<
  RK,
  ReadonlyArray<infer I> | Array<infer I>
>
  ? I
  : never;

/** Result item type from Q[F][RK]; supports unions and nullables on Q[F] */
export type ResultItemOf<
  Q,
  F extends keyof Q,
  RK extends string = TDefaultResultsKey
> = ItemFromContainer<NonNullable<Q[F]>, RK>;

/** Extract a string literal __typename if present */
export type TypenameOf<T> = T extends { __typename?: infer N }
  ? Extract<N, string>
  : never;

// Top-level variable names for a query's variables
export type AllowedKey<V> = Extract<keyof V, string>;

// Apollo-style keyArgs:
//
// ["filter", ["search"]]
// ["filter", "pagination"]
// ["filter", ["search", "other"]]
//
export type KeyArgsFor<V> = readonly (
  | AllowedKey<V> // "filter" | "pagination" | "order" | ...
  | readonly string[]
)[]; // ["search"], ["page", "perPage"], ...
