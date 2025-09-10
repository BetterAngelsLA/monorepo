// Shared type helpers (type-only)
export type ResultItemOf<Q, F extends keyof Q> = Q[F] extends {
  results: ReadonlyArray<infer I> | Array<infer I>;
}
  ? I
  : never;

export type TypenameOf<T> = T extends { __typename?: infer N }
  ? Extract<N, string>
  : never;

export type VarKeys<V> = Extract<keyof V, string>;
export type AllowedKeys<V> = Exclude<VarKeys<V>, 'pagination'>;

// Keys of Q whose value looks like an offset list (has .results: array)
export type OffsetListKey<Q> = {
  [K in keyof Q]-?: Q[K] extends { results: ReadonlyArray<any> | Array<any> }
    ? K
    : never;
}[keyof Q];
