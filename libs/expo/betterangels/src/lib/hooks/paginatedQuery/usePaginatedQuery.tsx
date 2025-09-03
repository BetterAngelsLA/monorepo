import type {
  OperationVariables,
  QueryHookOptions,
  QueryResult,
} from '@apollo/client';
import { NetworkStatus, useApolloClient } from '@apollo/client';
import { assertQueryFieldHasMerge } from '@monorepo/expo/shared/clients';
import { useCallback, useEffect, useMemo, useRef } from 'react';

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
  items: ReadonlyArray<TItem> | undefined;
  total: number;
};

/** Compose final variables for a request (override only if your shape differs) */
type ComposeVars<TVars extends OperationVariables> = (
  base: TVars | undefined,
  p: { offset: number; limit: number }
) => TVars;

/**
 * usePaginatedQuery
 * - Accepts your generated query hook (typed)
 * - Inferences TData/TVars from that hook
 * - You only pass TItem (or let a custom `select` infer it)
 * - Injects pagination; keeps `variables` stable internally
 */
export function usePaginatedQuery<TItem, H extends AnyGeneratedHook>(args: {
  /** Your generated hook, e.g. useFilterClientProfilesQuery */
  useQueryHook: H;

  /** Root field name in the result, e.g. "clientProfiles" */
  queryFieldName: string;

  /** Page size (defaults to 25) */
  pageSize?: number;

  /** Variables you’d normally pass to the generated hook (order, filters, etc.). */
  variables?: HookVars<H>;

  /** If your API stores pagination differently, provide a composer */
  composeVars?: ComposeVars<HookVars<H>>;

  /** Map result → { items, total }. Defaults to { [field].results, totalCount }. */
  select?: Selector<HookData<H>, TItem>;

  /** Extra deps that should trigger a refetch/reset */
  resetOn?: ReadonlyArray<unknown>;

  /* TODO: implement `resultsMode` or `includeUndefined` option?
   * Merged results can possibly include `undefined` values in list
   * sparse: include undefined
   * dense: exclude undefined
   * resultsMode?: 'dense' | 'sparse';
   */
}) {
  type TData = HookData<H>;
  type TVars = HookVars<H>;

  const {
    useQueryHook,
    queryFieldName,
    pageSize = DEFAULT_PAGE_SIZE,
    variables,
    composeVars,
    select,
    resetOn = [],
  } = args;

  // Ensure the merge policy exists for this field
  const client = useApolloClient();
  useMemo(() => {
    assertQueryFieldHasMerge(client.cache, queryFieldName);
  }, [client.cache, queryFieldName]);

  // Default selector
  const defaultSelect = useCallback<Selector<TData, TItem>>(
    (d) => {
      const field = (d as any)?.[queryFieldName] ?? {};
      return {
        items: field.results ?? undefined,
        total: field.totalCount ?? 0,
      };
    },
    [queryFieldName]
  );

  const effectiveSelect = select ?? defaultSelect;

  // Make `variables` stable **inside** the hook (identity-insensitive)
  const varsKey = useMemo(() => JSON.stringify(variables ?? {}), [variables]);
  const stableVars = useMemo<TVars | undefined>(() => variables, [varsKey]);

  // Default composer: copy base and inject pagination
  const defaultCompose: ComposeVars<TVars> = (base, { offset, limit }) => ({
    ...(base ?? ({} as TVars)),
    pagination: { limit, offset },
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
    refetch(initialVars as Partial<TVars>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varsKey, ...resetOn]);

  // Pagination
  const loadMore = useCallback(() => {
    if (!hasMore || loading || inFlight.current) return;
    inFlight.current = true;

    const expectedOffset = safeLen;
    const nextVars = makeVars(expectedOffset, pageSize);

    fetchMore({ variables: nextVars }).finally(() => {
      inFlight.current = false;
    });
  }, [hasMore, loading, safeLen, pageSize, makeVars, fetchMore]);

  return {
    items: (items ?? []) as ReadonlyArray<TItem>,
    total,
    loading,
    hasMore,
    loadMore,
    error,
  };
}
