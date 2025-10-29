/**
 * useInfiniteScrollQuery
 *
 * A React hook that wraps a generated Apollo query hook and adds
 * pagination plus a consistent return shape.
 *
 * It auto-detects whether your variables use:
 *   - { pagination: { page, perPage } }  OR
 *   - { pagination: { offset, limit } }
 * and composes subsequent fetchMore variables appropriately.
 *
 * It also ensures your Apollo cache has a merge policy for the target field,
 * so infinite scrolling works without data duplication.
 *
 * --------------------------------------------------------------------
 * Usage
 * --------------------------------------------------------------------
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
 */

import type {
  OperationVariables,
  QueryHookOptions,
  QueryResult,
} from '@apollo/client';
import { NetworkStatus } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAssertQueryFieldHasMerge } from './useAssertQueryFieldHasMerge';
import { buildVariablesForOffsetAndLimit } from './utils/buildVariablesForOffsetAndLimit';
import { detectPaginationShape } from './utils/detectPaginationShape';

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

/** Compose final variables for a request (optional override) */
type ComposeVars<TVars extends OperationVariables> = (
  baseVariables: TVars | undefined,
  page: { offset: number; limit: number }
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

  // Default selector: supports both wrapper shapes:
  // - generic: { results, totalCount }
  // - HMIS-like: { items, meta.totalCount } (optionally { total })
  const defaultSelect: Selector<any, any> = (data) => {
    const field = (data as any)?.[queryFieldName];

    if (!field) {
      return { items: undefined, total: 0 };
    }

    if (typeof field === 'object' && 'items' in field) {
      const meta = (field as any).meta;
      const totalFromMeta =
        meta && typeof meta.totalCount === 'number'
          ? meta.totalCount
          : undefined;
      const total =
        typeof (field as any).total === 'number'
          ? (field as any).total
          : totalFromMeta ?? 0;

      return {
        items: (field as any).items ?? undefined,
        total,
      };
    }

    return {
      items: (field as any).results ?? undefined,
      total: (field as any).totalCount ?? 0,
    };
  };

  const effectiveSelect = (select ?? defaultSelect) as Selector<TData, TItem>;

  // Stabilize incoming variables (identity-insensitive)
  const varsKey = useMemo(() => JSON.stringify(variables ?? {}), [variables]);

  const stableVars = useMemo(() => {
    return variables as TVars | undefined;
  }, [varsKey]);

  // Detect pagination shape from provided variables (page/perPage vs offset/limit)
  const paginationShape = useMemo(() => {
    return detectPaginationShape(stableVars as OperationVariables | undefined);
  }, [stableVars]);

  // Build variables for a given { offset, limit } using detected shape,
  // unless a custom composeVars is provided (which takes precedence).
  const makeVariablesForPage = useCallback(
    (offset: number, limit: number): TVars => {
      if (composeVars) {
        return composeVars(stableVars, { offset, limit });
      }

      return buildVariablesForOffsetAndLimit<TVars>(
        stableVars,
        paginationShape,
        { offset, limit }
      );
    },
    [composeVars, stableVars, paginationShape]
  );

  // Initial variables: if caller passed perPage, respect it; otherwise use pageSize
  const initialVars = useMemo(() => {
    if (paginationShape === 'pagePerPage') {
      const perPageFromCaller = Number(
        (stableVars as any)?.pagination?.perPage
      );

      const initialLimit =
        Number.isFinite(perPageFromCaller) && perPageFromCaller > 0
          ? perPageFromCaller
          : pageSize;

      return makeVariablesForPage(0, initialLimit);
    }

    // offset/limit or unknown → start with offset=0, limit=pageSize
    return makeVariablesForPage(0, pageSize);
  }, [makeVariablesForPage, pageSize, paginationShape, stableVars]);

  // Run the query
  const { data, fetchMore, refetch, networkStatus, error } = useQueryHook({
    variables: initialVars,
    notifyOnNetworkStatusChange: true,
    fetchPolicy,
    nextFetchPolicy,
  } as QueryHookOptions<TData, TVars>);

  // Shape data into the stable return format
  const { items, total } = useMemo(
    () => effectiveSelect(data as TData | undefined),
    [data, effectiveSelect]
  );

  const safeLength = items?.length ?? 0;
  const hasMore = safeLength < total;

  // Unified loading (initial or any in-flight)
  const loading =
    items === undefined ||
    (networkStatus !== NetworkStatus.ready &&
      networkStatus !== NetworkStatus.setVariables);

  // Prevent overlapping fetchMore calls
  const inFlightRef = useRef(false);
  useEffect(() => {
    if (!loading) {
      inFlightRef.current = false;
    }
  }, [loading]);

  // Refetch when semantic inputs change (stable variables) or when resetOn triggers
  useEffect(() => {
    refetch(initialVars as Partial<TVars>).catch((err) => {
      console.error('[useInfiniteScrollQuery] Refetch failed:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varsKey, ...resetOn]);

  // Pagination
  const loadMore = useCallback(() => {
    if (!hasMore || loading || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    const nextVars = makeVariablesForPage(
      safeLength,
      (() => {
        // Use the same chunk size the list started with.
        // For page/perPage, honor caller's perPage if provided; otherwise pageSize.
        if (paginationShape === 'pagePerPage') {
          const perPageFromCaller = Number(
            (stableVars as any)?.pagination?.perPage
          );

          if (Number.isFinite(perPageFromCaller) && perPageFromCaller > 0) {
            return perPageFromCaller;
          }
        }

        return pageSize;
      })()
    );

    fetchMore({ variables: nextVars }).catch(() => {
      inFlightRef.current = false;
    });
  }, [
    hasMore,
    loading,
    makeVariablesForPage,
    pageSize,
    paginationShape,
    safeLength,
    fetchMore,
    stableVars,
  ]);

  return {
    items: items ?? [],
    total,
    loading,
    hasMore,
    loadMore,
    error,
  };
}
