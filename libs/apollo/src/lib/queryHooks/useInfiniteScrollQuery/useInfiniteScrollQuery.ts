/**
 * useInfiniteScrollQuery
 *
 * A generic React hook for executing **infinite scroll** or **paginated list**
 * queries that respect the cache policies registered via `getQueryPolicyFactory`.
 *
 * It automatically reads the `QueryPolicyConfig` for the given query field from
 * Apollo’s cache (using `getQueryPolicyConfigFromCache`), interprets the
 * pagination mode (Offset or PerPage), and handles incremental fetching with
 * Apollo’s `fetchMore`.
 *
 * This hook standardizes infinite scrolling for all list-style queries, so you
 * don’t have to hand-manage pagination logic for each API field.
 *
 * -------------------------------------------------------------
 * Responsibilities
 * -------------------------------------------------------------
 * - Reads and validates `queryPolicyConfig` for the query field
 * - Builds normalized initial variables using the configured pagination mode
 * - Executes the provided Apollo `useQuery` hook
 * - Derives items and total count from the result via `itemsPath` and `totalCountPath`
 * - Exposes a `loadMore()` callback for fetching the next page
 * - Tracks loading state and prevents overlapping `fetchMore` calls
 * - Refetches automatically when variable dependencies change
 *
 * -------------------------------------------------------------
 * Example
 * -------------------------------------------------------------
 * const {
 *   items: clients,
 *   total,
 *   loading,
 *   hasMore,
 *   loadMore,
 *   error,
 * } = useInfiniteScrollQuery<HmisClientType, typeof useHmisListClientsQuery>({
 *   useQueryHook: useHmisListClientsQuery,
 *   queryFieldName: 'hmisListClients',
 *   variables: { filter },
 *   pageSize: 20,
 *   fetchPolicy: 'cache-and-network',
 *   nextFetchPolicy: 'cache-first',
 * });
 *
 * -------------------------------------------------------------
 * Behavior
 * -------------------------------------------------------------
 * - Uses the `QueryPolicyConfig` (retrieved from cache) to know how to:
 *   - read items (`itemsPath`)
 *   - read total (`totalCountPath`)
 *   - read pagination variables (`paginationMode`, `paginationLimitPath`, etc.)
 *
 * - On first render, runs `useQueryHook` with initial pagination variables.
 * - When `loadMore()` is called:
 *   - Computes the next page’s variables using `buildVariablesForPage`.
 *   - Calls Apollo’s `fetchMore()` with those variables.
 *   - Updates the internal reference (`lastVariablesRef`) so subsequent calls
 *     increment correctly.
 *
 * - The hook determines `hasMore` based on the ratio of items fetched to total.
 * - It avoids double-fetching by tracking in-flight state (`inFlightRef`).
 * - In development, it validates that `itemsPath` actually exists in data.
 *
 * -------------------------------------------------------------
 * Returns
 * -------------------------------------------------------------
 * {
 *   items: TItem[],      // list of normalized items
 *   total: number,       // total count from response
 *   loading: boolean,    // true while loading or fetching
 *   hasMore: boolean,    // true if more pages exist
 *   loadMore: () => void,// fetches next page
 *   error?: ApolloError, // query or network error
 * }
 *
 * -------------------------------------------------------------
 * Notes
 * -------------------------------------------------------------
 * - Requires that `getQueryPolicyFactory` has been used to register a
 *   corresponding `QueryPolicyConfig` for the given `queryFieldName`.
 * - Relies on Apollo Client’s cache policies to merge new pages correctly.
 * - This hook is pagination-mode agnostic — works for both Offset/Limit
 *   and Page/PerPage shapes.
 * - If no `queryPolicyConfig` is found, an error is thrown to help catch
 *   misconfigured cache setups early.
 */

import {
  NetworkStatus,
  useApolloClient,
  type QueryHookOptions,
} from '@apollo/client';
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

import { AnyGeneratedHook, HookData, HookVars } from './types';

type TProps<H extends AnyGeneratedHook> = {
  useQueryHook: H;
  queryFieldName: string;
  variables?: HookVars<H>;
  pageSize?: number;
  fetchPolicy?: QueryHookOptions<HookData<H>, HookVars<H>>['fetchPolicy'];
  nextFetchPolicy?: QueryHookOptions<
    HookData<H>,
    HookVars<H>
  >['nextFetchPolicy'];
};

export function useInfiniteScrollQuery<TItem, H extends AnyGeneratedHook>(
  props: TProps<H>
) {
  type TData = HookData<H>;
  type TVars = HookVars<H>;

  const {
    useQueryHook,
    queryFieldName,
    variables,
    pageSize = DEFAULT_QUERY_PAGE_SIZE,
    fetchPolicy = 'cache-and-network',
    nextFetchPolicy = 'cache-first',
  } = props;

  const apolloClient = useApolloClient();

  // pull the normalized policy config from cache; throw if missing
  const queryPolicyConfig = useMemo(() => {
    const cfg = getQueryPolicyConfigFromCache(
      apolloClient.cache,
      queryFieldName
    );

    if (!cfg) {
      throw new Error(
        `[useInfiniteScrollQuery] No queryPolicyConfig found for Query.${queryFieldName}. ` +
          `Make sure this field was registered via getQueryPolicyFactory and attached to the cache.`
      );
    }

    return cfg;
  }, [apolloClient.cache, queryFieldName]);

  // stabilize incoming vars
  const memoizedVariables = useDeepCompareMemoize(
    (variables ?? {}) as TVars
  ) as TVars;

  // build initial variables
  const initialVariables = useMemo(() => {
    return buildInitialVariables<TVars>({
      baseVariables: memoizedVariables,
      pageSize,
      ...queryPolicyConfig,
    });
  }, [memoizedVariables, pageSize, queryPolicyConfig]);

  const lastVariablesRef = useRef<TVars>(initialVariables);

  useEffect(() => {
    lastVariablesRef.current = initialVariables;
  }, [initialVariables]);

  // run the actual query
  const { data, fetchMore, refetch, networkStatus, error } = useQueryHook({
    variables: initialVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy,
    nextFetchPolicy,
  } as QueryHookOptions<TData, TVars>);

  // DEV: itemsPath exists
  if (process.env['NODE_ENV'] !== 'production' && data) {
    validatePathOrThrow(
      (data as any)[queryFieldName],
      queryPolicyConfig.itemsPath
    );
  }

  // normalize items/total using policy paths
  const { items, total } = useMemo(() => {
    return extractItemsAndTotalFromData<TData, TItem>({
      data: data as TData | undefined,
      queryFieldName,
      itemsPath: queryPolicyConfig.itemsPath,
      totalCountPath: queryPolicyConfig.totalCountPath,
    });
  }, [data, queryFieldName, queryPolicyConfig]);

  const currentItemCount = items?.length ?? 0;
  const hasMore = currentItemCount < total;

  const isLoading =
    items === undefined ||
    (networkStatus !== NetworkStatus.ready &&
      networkStatus !== NetworkStatus.setVariables);

  // avoid overlapping fetchMore
  const inFlightRef = useRef(false);
  useEffect(() => {
    if (!isLoading) {
      inFlightRef.current = false;
    }
  }, [isLoading]);

  // refetch when deps change
  useEffect(() => {
    refetch(initialVariables as Partial<TVars>).catch((err) => {
      console.error('[useInfiniteScrollQuery] Refetch failed:', err);
    });
  }, [memoizedVariables]);

  // load more using policy paths
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    const { paginationMode, paginationPerPagePath, paginationLimitPath } =
      queryPolicyConfig;

    const nextPageSize = getPageSizeFromVars({
      baseVariables: lastVariablesRef.current,
      paginationMode: paginationMode,
      paginationPerPagePath: paginationPerPagePath,
      paginationLimitPath: paginationLimitPath,
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
        inFlightRef.current = false;
      });
  }, [
    hasMore,
    isLoading,
    queryPolicyConfig,
    memoizedVariables,
    pageSize,
    fetchMore,
  ]);

  return {
    items: items ?? [],
    total,
    loading: isLoading,
    hasMore,
    loadMore,
    error,
  };
}
