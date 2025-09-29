/**
 * useInfiniteScrollQuery
 *
 * A React hook that wraps a generated Apollo query hook and adds
 * offset/limit pagination plus a consistent return shape.
 *
 * It ensures your Apollo cache has a merge policy for the target field,
 * so infinite scrolling works without data duplication.
 *
 * --------------------------------------------------------------------
 * Usage
 * --------------------------------------------------------------------
 *
 * // 1. Configure Apollo cache with a merge policy for your field:
 *
 * new InMemoryCache({
 *   typePolicies: {
 *     Query: {
 *       fields: {
 *         clientProfiles: {
 *           keyArgs: ['filters', 'order'],
 *           merge(existing = { results: [], totalCount: 0 }, incoming, { args }) {
 *             ...
 *           },
 *         },
 *       },
 *     },
 *   },
 * });
 *
 * // 2. Use the hook with your generated query hook:
 *
 * const {
 *   items,     // list of TItem, [] until first data
 *   total,     // total number of items
 *   loading,   // true while fetching/refetching
 *   hasMore,   // true if items.length < total
 *   loadMore,  // function to fetch the next page
 *   error,     // ApolloError if present
 * } = useInfiniteScrollQuery<UserRow, typeof useFilterClientProfilesQuery>({
 *   useQueryHook: useFilterClientProfilesQuery,
 *   queryFieldName: 'clientProfiles',
 *   variables: { filters: { search }, order: { id: Ordering.Asc } },
 *   pageSize: 25,
 * });
 *
 * --------------------------------------------------------------------
 * Arguments
 * --------------------------------------------------------------------
 *
 * @param useQueryHook       Your generated Apollo query hook
 * @param queryFieldName     Field name on Query with results + totalCount
 * @param pageSize           Page size (default 25)
 * @param variables          Variables normally passed to the hook
 * @param fetchPolicy        Apollo fetchPolicy (default "cache-and-network")
 * @param nextFetchPolicy    Apollo nextFetchPolicy (default "cache-first")
 * @param composeVars        Custom function to compose pagination variables
 * @param select             Map raw query data → { items, total }
 * @param resetOn            Dependencies that trigger a refetch/reset
 * @param silencePolicyCheck If true, log missing cache policy instead of throwing
 *
 * --------------------------------------------------------------------
 * Returns
 * --------------------------------------------------------------------
 *
 * {
 *   items:    Array<TItem>
 *   total:    number
 *   loading:  boolean
 *   hasMore:  boolean
 *   loadMore: () => void
 *   error:    ApolloError | undefined
 * }
 */

import type {
  OperationVariables,
  QueryHookOptions,
  QueryResult,
} from '@apollo/client';
import { NetworkStatus } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAssertQueryFieldHasMerge } from './useAssertQueryFieldHasMerge';

const DEFAULT_PAGE_SIZE = 25;

/** Infer data/vars from a generated Apollo hook */
type HookData<H> = H extends (
  options?: QueryHookOptions<infer D, any>
) => QueryResult<infer D2, any>
  ? D & D2
  : never;

type HookVars<H> = H extends (
  options?: QueryHookOptions<any, infer V>
) => QueryResult<any, infer V2>
  ? V & V2
  : OperationVariables;

/** The shape we expect for the hook argument */
type AnyGeneratedHook = (
  options: QueryHookOptions<any, any>
) => QueryResult<any, any>;

type Selector<TData, TItem> = (data: TData | undefined) => {
  /** Keep undefined until first data arrives to avoid empty-state flash */
  items: TItem[] | undefined;
  total: number;
};

/** Compose final variables for a request (override only if your shape differs) */
type ComposeVars<TVars extends OperationVariables> = (
  base: TVars | undefined,
  p: { offset: number; limit: number }
) => TVars;

type TProps<TItem, H> = {
  useQueryHook: H;
  queryFieldName: string;
  pageSize?: number;
  variables?: HookVars<H>;
  composeVars?: ComposeVars<HookVars<H>>;
  select?: Selector<HookData<H>, TItem>;
  resetOn?: Array<unknown>;
  fetchPolicy?: QueryHookOptions<HookData<H>, HookVars<H>>['fetchPolicy'];
  nextFetchPolicy?: QueryHookOptions<
    HookData<H>,
    HookVars<H>
  >['nextFetchPolicy'];
  silencePolicyCheck?: boolean;

  /* TODO: implement `resultsMode` or `includeUndefined` option?
   * Merged results can possibly include `undefined` values in list
   * sparse: include undefined
   * dense: exclude undefined
   * resultsMode?: 'dense' | 'sparse';
   */
};

export function useInfiniteScrollQuery<TItem, H extends AnyGeneratedHook>(
  args: TProps<TItem, H>
) {
  type TData = HookData<H>;
  type TVars = HookVars<H>;

  const {
    useQueryHook,
    queryFieldName,
    pageSize = DEFAULT_PAGE_SIZE,
    variables,
    composeVars,
    select,
    silencePolicyCheck,
    fetchPolicy = 'cache-and-network',
    nextFetchPolicy = 'cache-first',
    resetOn = [],
  } = args;

  // Ensure the merge policy exists for this field
  useAssertQueryFieldHasMerge(queryFieldName, !!silencePolicyCheck);

  // Default selector
  const defaultSelect: Selector<any, any> = (d) => {
    const field = (d as any)?.[queryFieldName] ?? {};
    return {
      items: field.results ?? undefined,
      total: field.totalCount ?? 0,
    };
  };
  const effectiveSelect = (select ?? defaultSelect) as Selector<TData, TItem>;

  // Make `variables` stable **inside** the hook (identity-insensitive)
  const varsKey = useMemo(() => JSON.stringify(variables ?? {}), [variables]);
  const stableVars = useMemo(() => variables as TVars | undefined, [varsKey]);

  // Default composer: copy base and inject pagination
  const defaultCompose: ComposeVars<TVars> = (base, { offset, limit }) => ({
    ...(base ?? ({} as TVars)),
    pagination: { limit, offset } as any,
  });

  const makeVars = useCallback(
    (offset: number, limit: number): TVars =>
      (composeVars ?? defaultCompose)(stableVars, { offset, limit }),
    [composeVars, stableVars]
  );

  // Initial variables
  const initialVars = useMemo(
    () => makeVars(0, pageSize),
    [makeVars, pageSize]
  );

  // Run query
  const { data, fetchMore, refetch, networkStatus, error } = useQueryHook({
    variables: initialVars,
    notifyOnNetworkStatusChange: true,
    fetchPolicy,
    nextFetchPolicy,
  } as QueryHookOptions<TData, TVars>);

  // Shape data
  const { items, total } = useMemo(
    () => effectiveSelect(data as TData | undefined),
    [data, effectiveSelect]
  );

  const safeLen = items?.length ?? 0;
  const hasMore = safeLen < total;

  // Unified loading (initial or any in-flight)
  const loading =
    items === undefined ||
    (networkStatus !== NetworkStatus.ready &&
      networkStatus !== NetworkStatus.setVariables);

  // Prevent overlapping fetchMore calls
  const inFlight = useRef(false);
  useEffect(() => {
    if (!loading) inFlight.current = false;
  }, [loading]);

  // Refetch when **semantic inputs** change (stable variables) or resetOn
  useEffect(() => {
    refetch(initialVars as Partial<TVars>).catch((err) => {
      console.error('[useInfiniteScrollQuery] Refetch failed:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varsKey, ...resetOn]);

  // Pagination
  const loadMore = useCallback(() => {
    if (!hasMore || loading || inFlight.current) return;
    inFlight.current = true;

    const nextVars = makeVars(safeLen, pageSize);
    fetchMore({ variables: nextVars }).catch(() => {
      inFlight.current = false;
    });
  }, [hasMore, loading, safeLen, pageSize, makeVars, fetchMore]);

  return {
    items: items ?? [],
    total,
    loading,
    hasMore,
    loadMore,
    error,
  };
}
