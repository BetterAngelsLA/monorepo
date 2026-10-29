import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toError } from '@monorepo/react/shared';
import { useQuery } from '@apollo/client/react';
import {
  ObjectAuditLogDocument,
  type ObjectAuditLogQuery,
  type ObjectAuditLogQueryVariables,
} from './__generated__/useObjectAuditLog.generated';

export type AuditAction =
  ObjectAuditLogQuery['objectAuditLog']['results'][number];
export type AuditEvent = AuditAction['events'][number];

const DEFAULT_PAGE_SIZE = 25;

export type ObjectAuditLogFilters = {
  /** Inclusive lower bound (ISO datetime). */
  dateFrom?: string | null;
  /** Inclusive upper bound (ISO datetime). */
  dateTo?: string | null;
  /** Restrict to a single acting user. */
  actorId?: string | null;
  /** Restrict to events rendered as system (no attributed user). */
  systemOnly?: boolean | null;
};

type UseObjectAuditLogArgs = ObjectAuditLogFilters & {
  targetType: ObjectAuditLogQueryVariables['targetType'];
  objectId: string;
  pageSize?: number;
};

/**
 * Fetches cursor pages of grouped audit actions for one object.
 *
 * "More" is the server's ``hasNextPage`` (§10), not an inference from a short
 * page: an action that happens to fill the page exactly would otherwise hide the
 * last page. ``loadMore`` follows ``endCursor`` and appends the next page, so an
 * event written between requests cannot repeat or skip an action the way an
 * offset would.
 *
 * Date/actor filters are applied server-side (ADR 0004 §21). Changing them
 * changes the query variables, which restarts at the first page — the cursor is
 * deliberately not carried across a filter change.
 *
 * ``retry`` re-runs the first page and then replays the cursors the user had
 * already loaded: Apollo's ``refetch`` replaces the cached result with page one
 * only, so replaying preserves the activity that was on screen before the
 * failure.
 */
export function useObjectAuditLog({
  targetType,
  objectId,
  pageSize = DEFAULT_PAGE_SIZE,
  dateFrom,
  dateTo,
  actorId,
  systemOnly,
}: UseObjectAuditLogArgs) {
  const variables = useMemo<ObjectAuditLogQueryVariables>(() => {
    const filters: NonNullable<ObjectAuditLogQueryVariables['filters']> = {};

    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    if (systemOnly) {
      filters.systemOnly = true;
    } else if (actorId) {
      filters.actorId = actorId;
    }

    return {
      targetType,
      objectId,
      limit: pageSize,
      // Omit the input entirely when nothing is set: the server defaults to
      // "no filters", and the variable set stays identical to the initial one.
      ...(Object.keys(filters).length > 0 ? { filters } : {}),
    };
  }, [targetType, objectId, dateFrom, dateTo, actorId, systemOnly, pageSize]);

  const { data, loading, error, fetchMore, refetch } = useQuery<
    ObjectAuditLogQuery,
    ObjectAuditLogQueryVariables
  >(ObjectAuditLogDocument, {
    variables,
    skip: !objectId,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const actions = useMemo(() => data?.objectAuditLog.results ?? [], [data]);
  const hasMore = data?.objectAuditLog.hasNextPage ?? false;
  const endCursor = data?.objectAuditLog.endCursor ?? null;

  const [pageError, setPageError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  // Cursors used by `loadMore`, in page order. Kept in a ref because they are
  // only read by `retry`; a new object/filter set starts with an empty chain.
  const pageCursorsRef = useRef<string[]>([]);
  const retryingRef = useRef(false);

  /** Fetch the page after *after* and append it to the cached result. */
  const appendPage = useCallback(
    async (after: string) => {
      await fetchMore({
        variables: { ...variables, after },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previous;
          }

          return {
            ...previous,
            objectAuditLog: {
              ...fetchMoreResult.objectAuditLog,
              results: [
                ...previous.objectAuditLog.results,
                ...fetchMoreResult.objectAuditLog.results,
              ],
            },
          };
        },
      });
    },
    [fetchMore, variables],
  );

  const loadMore = useCallback(async () => {
    // Guard against a double click appending the same page twice, and against a
    // retry racing the request that failed.
    if (!endCursor || inFlight.current) {
      return;
    }

    inFlight.current = true;
    setPageError(null);
    const cursor = endCursor;

    try {
      await appendPage(cursor);
      pageCursorsRef.current = [...pageCursorsRef.current, cursor];
    } catch (error) {
      // Apollo does not set the query-level ``error`` for a failed ``fetchMore``,
      // so a page failure is otherwise silent.
      // Log a stable event name, never the Apollo error (it carries the response
      // payload and operation variables).
      console.error('audit_log_load_more_failed');
      setPageError(toError(error));
    } finally {
      inFlight.current = false;
    }
  }, [appendPage, endCursor]);

  // A filter change starts a new page sequence; a failure or cursor from the
  // previous variables must not stick to the new list.
  useEffect(() => {
    setPageError(null);
    pageCursorsRef.current = [];
  }, [variables]);

  /**
   * Re-run the first page (after a failed load), then re-append the pages that
   * were already loaded. Failures surface through the query's `error`.
   */
  const retry = useCallback(async () => {
    if (retryingRef.current) {
      return;
    }

    retryingRef.current = true;
    setPageError(null);

    try {
      await refetch();

      for (const cursor of pageCursorsRef.current) {
        await appendPage(cursor);
      }
    } catch {
      // `refetch` rejects as well as setting `error`; swallow the rejection so an
      // unhandled promise cannot escape from the retry button.
      console.error('audit_log_reload_failed');
    } finally {
      retryingRef.current = false;
    }
  }, [appendPage, refetch]);

  return {
    actions,
    loading: loading && !data,
    loadingMore: loading && Boolean(data),
    error,
    loadMoreError: pageError,
    hasMore,
    loadMore,
    retry,
  };
}
