/**
 * useInfiniteScrollQuery
 *
 * A **React hook** for executing infinite-scroll or paginated list queries using Apollo Client v4.
 * It wraps the standard `useQuery` hook and automatically handles pagination,
 * cache merge policies, and incremental fetching.
 *
 * ---------------------------------------------------------------------------
 * Responsibilities
 * ---------------------------------------------------------------------------
 * • Reads the `QueryPolicyConfig` for the target field from Apollo's cache
 *   via `getQueryPolicyConfigFromCache`.
 * • Builds normalized initial variables based on the configured pagination mode
 *   (Offset/Limit or Page/PerPage).
 * • Executes the provided `TypedDocumentNode` query with Apollo’s `useQuery`.
 * • Derives the items array and total count from the result using the configured
 *   `itemsPath` and `totalCountPath`.
 * • Exposes a `loadMore()` function for fetching the next page of results.
 * • Exposes a `reload()` function for manually refetching the initial page.
 * • Tracks loading state and prevents overlapping `fetchMore` calls.
 * • Resets pagination state when variables change so subsequent `loadMore()` calls
 *   continue from the correct starting page/offset.
 *
 * ---------------------------------------------------------------------------
 * Usage Example
 * ---------------------------------------------------------------------------
 * const { items, total, loading, hasMore, loadMore, error } =
 *   useInfiniteScrollQuery<TaskItem, TasksQuery, TasksQueryVariables>({
 *     document: TasksDocument,
 *     queryFieldName: 'tasks',
 *     variables: { filters: { q: 'open' } },
 *     pageSize: 25,
 *     fetchPolicy: 'cache-and-network',
 *     nextFetchPolicy: 'cache-first',
 *   });
 *
 * ---------------------------------------------------------------------------
 * Behavior
 * ---------------------------------------------------------------------------
 * • Uses the `QueryPolicyConfig` to determine:
 *   - how to read items (`itemsPath`)
 *   - how to read total (`totalCountPath`)
 *   - which pagination shape to use (`Offset` vs `PerPage`)
 * • When `loadMore()` is called:
 *   - computes the next page’s variables using `buildVariablesForPage`
 *   - calls Apollo’s `fetchMore` with those variables
 *   - updates the internal reference to track the new offset/page
 * • When `reload()` is called:
 *   - resets the internal pagination reference back to the initial variables
 *   - calls Apollo’s `refetch` using the initial variables
 * • Determines `hasMore` by comparing `items.length` to `total`.
 * • Skips redundant `fetchMore` calls via an internal in-flight guard.
 * • Variable changes are tracked via `NetworkStatus.setVariables` and are treated
 *   as a "loading" state (distinct from manual `reload()`).
 *
 * ---------------------------------------------------------------------------
 * Returns
 * ---------------------------------------------------------------------------
 * {
 *   items:       TItem[],      // list of items (empty until first data)
 *   total:       number,       // total count reported by server
 *   loading:     boolean,      // true during initial load or variable-change reload
 *   loadingMore: boolean,      // true while fetching the next page via fetchMore
 *   reloading:   boolean,      // true while a manual reload() refetch is in flight
 *   hasMore:     boolean,      // true if more results remain
 *   loadMore:    () => void,   // fetches next page
 *   reload:      () => void,   // refetches initial page (manual)
 *   error?:      ApolloError,  // query or network error
 * }
 *
 * ---------------------------------------------------------------------------
 * Notes
 * ---------------------------------------------------------------------------
 * • Requires that a `QueryPolicyConfig` be registered for the target field
 *   (via your cache policy setup).
 * • The hook is pagination-mode agnostic — works with both Offset/Limit
 *   and Page/PerPage queries.
 * • If the policy config is missing, the hook throws an explicit error.
 * • Compatible with Apollo Client v4 and `TypedDocumentNode` queries.
 * • With `fetchPolicy: 'cache-and-network'`, variable changes may keep showing
 *   previous results while the new request is in flight; `loading` will still
 *   reflect the variable-change network state.
 */

import {
  NetworkStatus,
  type FetchPolicy,
  type OperationVariables,
  type TypedDocumentNode,
  type WatchQueryFetchPolicy,
} from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDeepCompareMemoize } from 'use-deep-compare-effect';

import { DEFAULT_QUERY_PAGE_SIZE } from '../../cachePolicy/constants';
import { getQueryPolicyConfigFromCache } from '../../cacheStore/utils/getQueryPolicyConfigFromCache';
import {
  buildInitialVariables,
  buildVariablesForPage,
  extractItemsAndTotalFromData,
  getPageSizeFromVars,
  validatePathOrThrow,
} from './utils';

type TProps<
  TData extends Record<string, unknown>,
  TVars extends OperationVariables
> = {
  document: TypedDocumentNode<TData, TVars>;
  queryFieldName: Extract<keyof TData, string>;
  variables?: TVars;
  pageSize?: number;
  fetchPolicy?: WatchQueryFetchPolicy;
  nextFetchPolicy?: FetchPolicy;
};

export function useInfiniteScrollQuery<
  TItem,
  TData extends Record<string, unknown>,
  TVars extends OperationVariables = OperationVariables
>(props: TProps<TData, TVars>) {
  const {
    document,
    queryFieldName,
    variables,
    pageSize = DEFAULT_QUERY_PAGE_SIZE,
    fetchPolicy = 'cache-and-network',
    nextFetchPolicy = 'cache-first',
  } = props;

  const apolloClient = useApolloClient();

  // Deep-memoize incoming variables to avoid unnecessary refetches
  const memoizedVariables = useDeepCompareMemoize(
    (variables ?? {}) as TVars
  ) as TVars;

  // Retrieve the QueryPolicyConfig from the actual cache
  const queryPolicyConfig = useMemo(() => {
    const cfg = getQueryPolicyConfigFromCache(
      apolloClient.cache,
      queryFieldName
    );

    if (!cfg) {
      throw new Error(
        `[useInfiniteScrollQuery] No queryPolicyConfig found for Query.${queryFieldName}. Ensure this field is registered via getQueryPolicyFactory and attached to the cache.`
      );
    }

    return cfg;
  }, [apolloClient.cache, queryFieldName]);

  // Build the initial variables based on the policy config
  const initialVariables = useMemo(() => {
    return buildInitialVariables<TVars>({
      baseVariables: memoizedVariables,
      pageSize,
      ...queryPolicyConfig,
    });
  }, [memoizedVariables, pageSize, queryPolicyConfig]);

  const lastVariablesRef = useRef<TVars>(initialVariables);

  // Execute the query
  const {
    data,
    fetchMore,
    refetch,
    networkStatus,
    error: queryError,
  } = useQuery<TData, TVars>(document, {
    variables: initialVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy,
    nextFetchPolicy,
  });

  // Validate structure in DEV env
  if (process.env['NODE_ENV'] !== 'production' && data) {
    validatePathOrThrow(
      (data as any)[queryFieldName],
      queryPolicyConfig.itemsPath
    );
  }

  // Extract items and total count based on policy paths
  const { items, total } = useMemo(() => {
    return extractItemsAndTotalFromData<TData, TItem>({
      data: data as TData | undefined,
      queryFieldName,
      itemsPath: queryPolicyConfig.itemsPath,
      totalCountPath: queryPolicyConfig.totalCountPath,
    });
  }, [data, queryFieldName, queryPolicyConfig]);

  // Reload on manual request
  const isManualReloadRef = useRef(false);

  const reloadManual = useCallback(async () => {
    isManualReloadRef.current = true;

    lastVariablesRef.current = initialVariables;

    try {
      await refetch(initialVariables as Partial<TVars>);
    } catch (err) {
      console.error('[useInfiniteScrollQuery] Refetch failed:', err);
    } finally {
      isManualReloadRef.current = false;
    }
  }, [initialVariables, refetch]);

  const isFetchMoreInFlightRef = useRef(false);

  useEffect(() => {
    lastVariablesRef.current = initialVariables;
    isFetchMoreInFlightRef.current = false;
  }, [initialVariables]);

  // Loading statuses (Apollo + intent)
  const isLoadingMore = networkStatus === NetworkStatus.fetchMore;
  const isApolloRefetching = networkStatus === NetworkStatus.refetch;
  const isApolloInitialLoading = networkStatus === NetworkStatus.loading;
  const isApolloSettingVariables = networkStatus === NetworkStatus.setVariables;

  const isInitialLoading = items === undefined && isApolloInitialLoading;
  const isManualReloading = isApolloRefetching && isManualReloadRef.current;
  const isReloadingFromVariableChange =
    (isApolloRefetching && !isManualReloadRef.current) ||
    isApolloSettingVariables;

  // What the UI calls "loading" (initial + variable-change reload)
  const isLoading = isInitialLoading || isReloadingFromVariableChange;

  // Any in-flight request we want to block loadMore during
  const isAnyLoading = isLoading || isManualReloading || isLoadingMore;

  const currentItemCount = items?.length ?? 0;
  const hasMore = currentItemCount < total;

  // reset network states
  useEffect(() => {
    if (networkStatus !== NetworkStatus.fetchMore) {
      isFetchMoreInFlightRef.current = false;
    }
  }, [networkStatus]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (!hasMore || isAnyLoading || isFetchMoreInFlightRef.current) {
      return;
    }

    isFetchMoreInFlightRef.current = true;

    const { paginationMode, paginationPerPagePath, paginationLimitPath } =
      queryPolicyConfig;

    const nextPageSize = getPageSizeFromVars({
      baseVariables: lastVariablesRef.current,
      paginationMode,
      paginationPerPagePath,
      paginationLimitPath,
      fallback: pageSize,
    });

    const nextVariables = buildVariablesForPage<TVars>({
      previousVariables: lastVariablesRef.current,
      incrementBy: nextPageSize,
      ...queryPolicyConfig,
    });

    fetchMore({ variables: nextVariables })
      .then(() => {
        lastVariablesRef.current = nextVariables;
      })
      .catch(() => {
        isFetchMoreInFlightRef.current = false;
      });
  }, [hasMore, isAnyLoading, queryPolicyConfig, pageSize, fetchMore]);

  return {
    items: items ?? [],
    total,
    loading: isLoading,
    loadingMore: isLoadingMore,
    reloading: isManualReloading,
    hasMore,
    loadMore,
    reload: reloadManual,
    error: queryError,
  };
}
