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
 *   (Offset/Limit).
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
 *   - which pagination variable paths to use (`paginationOffsetPath`, `paginationLimitPath`)
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
 *   error?:      ApolloError,  // query or network error or fetchMore error.
 *   queryKey:    string,       // stable identity of the query inputs (same key ⇒ same dataset)
 * }
 *
 * ---------------------------------------------------------------------------
 * Notes
 * ---------------------------------------------------------------------------
 * • Requires that a `QueryPolicyConfig` be registered for the target field
 *   (via your cache policy setup).
 * • Works with Offset/Limit paginated queries.
 * • If the policy config is missing, the hook throws an explicit error.
 * • Compatible with Apollo Client v4 and `TypedDocumentNode` queries.
 * • With `fetchPolicy: 'cache-and-network'`, variable changes may keep showing
 *   previous results while the new request is in flight; `loading` will still
 *   reflect the variable-change network state.
 */

import {
  ErrorLike,
  NetworkStatus,
  type FetchPolicy,
  type OperationVariables,
  type TypedDocumentNode,
  type WatchQueryFetchPolicy,
} from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { canonicalStringify } from '@apollo/client/utilities';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDeepCompareMemoize } from 'use-deep-compare-effect';
import { DEFAULT_QUERY_PAGE_SIZE } from '../../cachePolicy/constants';
import { getQueryPolicyConfigFromCache } from '../../cacheStore/utils/queryPolicyConfigRegistry';
import { toErrorLike } from '../../errors';
import { getApolloRuntimeConfig } from '../../runtime';
import {
  buildInitialVariables,
  buildVariablesForPage,
  extractItemsAndTotalFromData,
  getPageSizeFromVars,
} from './utils';
import { assertValueAtPath } from './utils/assertValueAtPath';

type TProps<
  TData extends Record<string, unknown>,
  TVars extends OperationVariables,
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
  TVars extends OperationVariables = OperationVariables,
>(props: TProps<TData, TVars>) {
  const {
    document,
    queryFieldName,
    variables,
    pageSize = DEFAULT_QUERY_PAGE_SIZE,
    fetchPolicy = 'cache-and-network',
    nextFetchPolicy = 'cache-first',
  } = props;

  const { isDevEnv } = getApolloRuntimeConfig();

  const apolloClient = useApolloClient();

  const fetchMoreErrorRef = useRef<ErrorLike | undefined>(undefined);

  // Deep-memoize incoming variables to avoid unnecessary refetches
  const memoizedVariables = useDeepCompareMemoize(
    (variables ?? {}) as TVars,
  ) as TVars;

  // Retrieve the QueryPolicyConfig from the actual cache
  const queryPolicyConfig = useMemo(() => {
    const cfg = getQueryPolicyConfigFromCache(
      apolloClient.cache,
      queryFieldName,
    );

    if (!cfg) {
      throw new Error(
        `[useInfiniteScrollQuery] No queryPolicyConfig found for Query.${queryFieldName}. Ensure this field is registered via getQueryPolicyFactory and attached to the cache.`,
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

  // Stable identity of the query inputs (variables + page size), built with
  // Apollo's canonical serializer. Unlike the items array, it only changes
  // when the query is replaced — loading another page does not touch it — so
  // consumers can use it to reset UI state (e.g. list scroll position) when
  // the dataset changes.
  const queryKey = useMemo(
    () => canonicalStringify(initialVariables),
    [initialVariables],
  );

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

  if (isDevEnv && data) {
    assertValueAtPath({
      source: (data as Record<string, unknown>)[queryFieldName],
      path: queryPolicyConfig.itemsPath,
      shouldThrow: true,
    });
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

  const stableItems = useMemo(() => items ?? [], [items]);

  // Reload on manual request
  const isManualReloadRef = useRef(false);

  const reloadManual = useCallback(async () => {
    isManualReloadRef.current = true;

    // Fresh identity invalidates in-flight fetchMore requests: the guards
    // below compare `lastVariablesRef.current` by reference. Without this, a
    // page-2 response arriving after the reload advances the pagination base
    // past the overwritten (page-1-only) cache, and the next loadMore skips
    // a page — leaving `undefined` holes that make the field unreadable.
    lastVariablesRef.current = { ...initialVariables } as TVars;
    fetchMoreErrorRef.current = undefined;

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
    fetchMoreErrorRef.current = undefined; // any error belongs to the previous variable set
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

  const currentItemCount = stableItems.length;
  const hasMore = currentItemCount < total;

  // reset network states
  useEffect(() => {
    if (networkStatus !== NetworkStatus.fetchMore) {
      isFetchMoreInFlightRef.current = false;
    }
  }, [networkStatus]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (!hasMore || isAnyLoading || isFetchMoreInFlightRef.current) {
      return;
    }

    isFetchMoreInFlightRef.current = true;

    const baseVariables = lastVariablesRef.current;

    const { paginationLimitPath } = queryPolicyConfig;

    const nextPageSize = getPageSizeFromVars({
      baseVariables,
      paginationLimitPath,
      fallback: pageSize,
    });

    const nextVariables = buildVariablesForPage<TVars>({
      previousVariables: baseVariables,
      incrementBy: nextPageSize,
      ...queryPolicyConfig,
    });

    fetchMore({ variables: nextVariables })
      .then(() => {
        // Ignore responses whose variables changed while the request was in
        // flight — the variables-change effect already reset the pagination
        // base to the current page-1 variables.
        if (lastVariablesRef.current !== baseVariables) {
          return;
        }

        lastVariablesRef.current = nextVariables;
      })
      .catch((err) => {
        // Ignore failures from a superseded request (variables changed or a
        // manual reload happened while it was in flight).
        if (lastVariablesRef.current !== baseVariables) {
          return;
        }

        console.error('[useInfiniteScrollQuery] fetchMore failed:', err);
        fetchMoreErrorRef.current = toErrorLike(err);
        isFetchMoreInFlightRef.current = false;
      });
  }, [hasMore, isAnyLoading, queryPolicyConfig, pageSize, fetchMore]);

  return {
    items: stableItems,
    total,
    queryKey,
    loading: isLoading,
    loadingMore: isLoadingMore,
    reloading: isManualReloading,
    hasMore,
    loadMore,
    reload: reloadManual,
    error: queryError ?? fetchMoreErrorRef.current,
  };
}
