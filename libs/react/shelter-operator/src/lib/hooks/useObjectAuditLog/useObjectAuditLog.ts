import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type UseObjectAuditLogArgs = {
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
 * ``retry`` re-runs the first page and then replays the cursors the user had
 * already loaded: Apollo's ``refetch`` replaces the cached result with page one
 * only, so replaying preserves the activity that was on screen before the
 * failure.
 */
export function useObjectAuditLog({
  targetType,
  objectId,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseObjectAuditLogArgs) {
  const variables = useMemo<ObjectAuditLogQueryVariables>(
    () => ({
      targetType,
      objectId,
      limit: pageSize,
    }),
    [targetType, objectId, pageSize],
  );

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

  // Cursors used by `loadMore`, in page order. Kept in a ref because they are
  // only read by `retry`; a new object starts with an empty chain.
  const pageCursorsRef = useRef<string[]>([]);
  const retryingRef = useRef(false);
  const loadMoreInFlightRef = useRef(false);

  // Bumped on every object/variables change. Async work captures the value it
  // started with, so a page that resolves after the switch cannot append itself
  // to the new object's cache or cursor chain.
  const generationRef = useRef(0);
  const [retryError, setRetryError] = useState(false);

  useEffect(() => {
    generationRef.current += 1;
    pageCursorsRef.current = [];
    setRetryError(false);
  }, [variables]);

  /** Fetch the page after *after* and append it to the cached result. */
  const appendPage = useCallback(
    async (after: string, generation: number) => {
      await fetchMore({
        variables: { ...variables, after },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult || generationRef.current !== generation) {
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
    if (
      !endCursor ||
      loadMoreInFlightRef.current ||
      retryingRef.current ||
      pageCursorsRef.current.includes(endCursor)
    ) {
      return;
    }

    const cursor = endCursor;
    const generation = generationRef.current;
    loadMoreInFlightRef.current = true;

    try {
      await appendPage(cursor, generation);
      if (generationRef.current !== generation) {
        return;
      }
      pageCursorsRef.current = [...pageCursorsRef.current, cursor];
      // A successful page restores the part a failed retry replay lost.
      setRetryError(false);
    } catch {
      if (generationRef.current !== generation) {
        return;
      }
      // Apollo does not set the query-level ``error`` for a failed ``fetchMore``.
      // NOTE: the activity-log hardening follow-up adds a visible load-more
      // error state; until then a failed page load is logged only.
      // Log a stable event name, never the Apollo error (it carries the response
      // payload and operation variables).
      console.error('audit_log_load_more_failed');
    } finally {
      loadMoreInFlightRef.current = false;
    }
  }, [appendPage, endCursor]);

  /**
   * Re-run the first page (after a failed load), then re-append the pages that
   * were already loaded. A refetch failure surfaces through the query's `error`;
   * a replay failure has no Apollo query error, so it sets `retryError` and
   * keeps only the pages that actually came back.
   */
  const retry = useCallback(async () => {
    if (retryingRef.current || loadMoreInFlightRef.current) {
      return;
    }

    retryingRef.current = true;
    setRetryError(false);

    const generation = generationRef.current;
    const cursors = [...pageCursorsRef.current];
    const replayed: string[] = [];
    let refreshed = false;

    try {
      await refetch();
      refreshed = true;

      if (generationRef.current !== generation) {
        return;
      }

      for (const cursor of cursors) {
        if (generationRef.current !== generation) {
          return;
        }

        await appendPage(cursor, generation);

        if (generationRef.current !== generation) {
          return;
        }

        replayed.push(cursor);
      }

      pageCursorsRef.current = replayed;
    } catch {
      if (generationRef.current !== generation) {
        return;
      }

      if (refreshed) {
        // The first page came back, but a replayed page did not. Keeping the
        // successful prefix keeps the cursor chain in step with the cache; the
        // failed cursor is the cache's endCursor, so Load more can retry it.
        pageCursorsRef.current = replayed;
        setRetryError(true);
        console.error('audit_log_replay_failed');
      } else {
        // `refetch` rejects as well as setting `error`; swallow the rejection so
        // an unhandled promise cannot escape from the retry button.
        console.error('audit_log_reload_failed');
      }
    } finally {
      retryingRef.current = false;
    }
  }, [appendPage, refetch]);

  return {
    actions,
    loading: loading && !data,
    loadingMore: loading && Boolean(data),
    error,
    retryError,
    hasMore,
    loadMore,
    retry,
  };
}
