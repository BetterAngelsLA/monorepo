import {
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
} from '../constants';

export type VarKeys<V> = Extract<keyof V, string>;
export type AllowedKeys<V> = Exclude<VarKeys<V>, 'pagination'>;

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

/** Convenience: typename at Q[F][RK][i].__typename */
export type ItemTypenameOf<
  Q,
  F extends keyof Q,
  RK extends string = TDefaultResultsKey
> = TypenameOf<ResultItemOf<Q, F, RK>>;

/** True if ANY member of union U has key RK */
type UnionHasKey<U, RK extends PropertyKey> = U extends unknown
  ? U extends Record<RK, any>
    ? true
    : never
  : never;

/** Keys of Q whose value type has RK on ANY union branch (after NonNullable). */
export type OffsetListKey<Q, RK extends string = TDefaultResultsKey> = Extract<
  {
    [K in keyof Q]-?: UnionHasKey<NonNullable<Q[K]>, RK> extends never
      ? never
      : K;
  }[keyof Q],
  string
>;

/** Second-level key under pagination, if present on variables type */
export type PaginationKeyOf<V> = 'pagination' extends keyof V
  ? NonNullable<V['pagination']> extends Record<string, any>
    ? Extract<keyof NonNullable<V['pagination']>, string>
    : never
  : never;

/** A single keyArgs element: either a top-level allowed key, or a tuple selecting pagination.<subkey> */
export type KeyArgSpec<V> =
  | AllowedKeys<V>
  | readonly ['pagination', PaginationKeyOf<V>];
