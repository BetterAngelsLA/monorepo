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

type Selector<TData, TItem> = (data: TData | undefined) => {
  items: ReadonlyArray<TItem> | undefined;
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
    searchQuery = '',
    resetOn = [],
  } = args;

  console.log('*****************  HOOK searchQuery:', searchQuery);

  // Assert cache policy exists
  const client = useApolloClient();

  useMemo(() => {
    assertQueryFieldHasMerge(client.cache, queryFieldName);
  }, [client.cache, queryFieldName]);

  const defaultSelect: Selector<any, any> = (d) => {
    const field = (d as any)?.[queryFieldName] ?? {};
    return {
      items: field.results ?? undefined, // undefined === initial loading
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

  const baseVars = useMemo(
    () =>
      effectiveBuildVars({ search: searchQuery, offset: 0, limit: pageSize }),
    [searchQuery, pageSize, effectiveBuildVars, ...resetOn]
  );

  const { data, fetchMore, refetch, networkStatus, error } = useQueryHook({
    variables: baseVars,
    notifyOnNetworkStatusChange: true,
  });

  // console.log();
  // console.log('| -------------  data  ------------- |');
  // console.log(data);
  // const res = (data && (data as any)['results']) || {};
  // console.log(JSON.stringify(res, null, 2));
  // console.log(JSON.stringify(data, null, 2));
  // console.log();

  const { items, total } = useMemo(
    () => effectiveSelect(data),
    [data, effectiveSelect]
  );

  const safeLen = items?.length ?? 0; // account for items.lenth being undefined
  const hasMore = safeLen < total;

  const loading =
    items === undefined ||
    (networkStatus !== NetworkStatus.ready &&
      networkStatus !== NetworkStatus.setVariables);

  const inFlight = useRef(false);

  useEffect(() => {
    if (!loading) {
      inFlight.current = false;
    }
  }, [loading]);

  // Reset on search / resetOn change
  useEffect(() => {
    refetch(baseVars as Partial<TVars>).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, ...resetOn]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || inFlight.current) {
      return;
    }

    inFlight.current = true;

    const nextVars = effectiveBuildVars({
      search: searchQuery,
      offset: safeLen,
      limit: pageSize,
    });

    fetchMore({ variables: nextVars }).catch(() => {
      inFlight.current = false;
    });
  }, [
    hasMore,
    loading,
    safeLen,
    searchQuery,
    pageSize,
    effectiveBuildVars,
    fetchMore,
  ]);

  return {
    items: items || [],
    total,
    loading,
    hasMore,
    loadMore,
    error,
  };
}
