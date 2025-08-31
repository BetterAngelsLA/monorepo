// usePaginatedQuery.tsx

import {
  NetworkStatus,
  useApolloClient,
  type ApolloQueryResult,
} from '@apollo/client';
import { assertQueryFieldHasMerge } from '@monorepo/expo/shared/clients';
import { useCallback, useEffect, useMemo, useRef } from 'react';

type FetchMoreFn<TData, TVars> = (opts: {
  variables: TVars;
}) => Promise<ApolloQueryResult<TData>>;

type UseQueryHook<TData, TVars> = (args: {
  variables: TVars;
  notifyOnNetworkStatusChange?: boolean;
}) => {
  data: TData | undefined;
  fetchMore: FetchMoreFn<TData, TVars>;
  refetch: (vars?: Partial<TVars>) => Promise<ApolloQueryResult<TData>>;
  networkStatus: NetworkStatus;
  error?: unknown;
};

// --- types for customization ---
type Selector<TData, TItem> = (data: TData | undefined) => {
  items: ReadonlyArray<TItem>;
  total: number;
};

type BuildVars<TVars> = (params: {
  search: string;
  offset: number;
  limit: number;
}) => TVars;

export function usePaginatedQuery<TData, TItem, TVars>(args: {
  useQueryHook: UseQueryHook<TData, TVars>;
  queryFieldName: string; // must match your Query field (e.g., "interactionAuthors")
  searchQuery?: string;
  pageSize: number;
  /** defaults to d?.<queryFieldName>.results + totalCount */
  select?: Selector<TData, TItem>;
  /** defaults to { filters:{search}, pagination:{offset,limit} } */
  buildVars?: BuildVars<TVars>;
  initialSearch?: string;
  debounceMs?: number;
  resetOn?: ReadonlyArray<unknown>;
}) {
  const {
    useQueryHook,
    queryFieldName,
    pageSize,
    select,
    buildVars,
    initialSearch = '',
    searchQuery = '',
    // debounceMs = 250,
    resetOn = [],
  } = args;

  console.log('*****************  HOOK searchQuery:', searchQuery);

  // --- 1. Assert cache policy exists ---
  const client = useApolloClient();

  useMemo(() => {
    // const tp = getTypePoliciesFromCache(client.cache);
    // assertQueryFieldHasMerge(tp, queryFieldName);
    assertQueryFieldHasMerge(client.cache, queryFieldName);
  }, [client.cache, queryFieldName]);

  // --- 2. Search w/ debounce ---
  //   const [search, setSearch] = useState(initialSearch);
  //   const [debounced, setDebounced] = useState(initialSearch);

  //   useEffect(() => {
  //     const t = setTimeout(() => setDebounced(search), debounceMs);
  //     return () => clearTimeout(t);
  //   }, [search, debounceMs]);

  // --- 3. Default builders ---
  const defaultSelect: Selector<any, any> = (d) => {
    const field = (d as any)?.[queryFieldName] ?? {};
    return {
      items: field.results ?? [],
      total: field.totalCount ?? 0,
    };
  };

  const defaultBuildVars: BuildVars<any> = ({ search, offset, limit }) =>
    ({
      filters: { search },
      pagination: { limit, offset },
    } as any);

  const effectiveSelect = (select ?? defaultSelect) as Selector<TData, TItem>;
  const effectiveBuildVars = (buildVars ??
    defaultBuildVars) as BuildVars<TVars>;

  // --- 4. Run query (offset 0) ---
  const baseVars = useMemo(
    () =>
      effectiveBuildVars({ search: searchQuery, offset: 0, limit: pageSize }),
    [searchQuery, pageSize, effectiveBuildVars, ...resetOn]
  );

  const { data, fetchMore, refetch, networkStatus, error } = useQueryHook({
    variables: baseVars,
    notifyOnNetworkStatusChange: true,
  });

  const { items, total } = useMemo(
    () => effectiveSelect(data),
    [data, effectiveSelect]
  );
  const hasMore = items.length < total;
  const isLoadingMore = networkStatus === NetworkStatus.fetchMore;

  const inFlight = useRef(false);
  useEffect(() => {
    if (!isLoadingMore) inFlight.current = false;
  }, [isLoadingMore]);

  // Reset on search / resetOn change
  useEffect(() => {
    refetch(baseVars as Partial<TVars>).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, ...resetOn]);

  // --- 5. Load more (cache handles merge) ---
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || inFlight.current) return;
    inFlight.current = true;

    const nextOffset = items.length;
    const nextVars = effectiveBuildVars({
      search: searchQuery,
      offset: nextOffset,
      limit: pageSize,
    });

    fetchMore({ variables: nextVars }).catch(() => {
      inFlight.current = false;
    });
  }, [
    hasMore,
    isLoadingMore,
    items.length,
    searchQuery,
    pageSize,
    effectiveBuildVars,
    fetchMore,
  ]);

  return {
    items,
    total,
    // search,
    // setSearch,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
  };
}
