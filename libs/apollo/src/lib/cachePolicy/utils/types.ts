// Works for any container key like "results", "items", "nodes", etc.
// Default remains "results" for backward compatibility.

import { DEFAULT_QUERY_RESULTS_KEY } from '../constants';

export type VarKeys<V> = Extract<keyof V, string>;
export type AllowedKeys<V> = Exclude<VarKeys<V>, 'pagination'>;

export type TDefaultResultsKey = typeof DEFAULT_QUERY_RESULTS_KEY;

// Pull the item type out of Q[F][RK] when Q[F] structurally matches { [RK]: I[] }
export type ResultItemOf<
  Q,
  F extends keyof Q,
  RK extends string = TDefaultResultsKey
> = Q[F] extends Record<RK, ReadonlyArray<infer I> | Array<infer I>>
  ? I
  : never;

// Extract a string literal __typename if present (common with addTypename: true)
export type TypenameOf<T> = T extends { __typename?: infer N }
  ? Extract<N, string>
  : never;

// Convenience: directly get the item typename at Q[F][RK][i].__typename
export type ItemTypenameOf<
  Q,
  F extends keyof Q,
  RK extends string = TDefaultResultsKey
> = TypenameOf<ResultItemOf<Q, F, RK>>;

// Find the keys of Q that look like an offset list under the provided results key
export type OffsetListKey<Q, RK extends string = TDefaultResultsKey> = {
  [K in keyof Q]-?: Q[K] extends Record<RK, ReadonlyArray<any> | Array<any>>
    ? K
    : never;
}[keyof Q];

// (Optional) Container-level typename if you ever need it (e.g., 'TaskTypeOffsetPaginated')
export type ContainerTypenameOf<Q, F extends keyof Q> = TypenameOf<Q[F]>;
