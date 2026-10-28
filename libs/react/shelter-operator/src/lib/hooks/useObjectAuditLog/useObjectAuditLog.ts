import { useCallback, useMemo } from 'react';
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

  const loadMore = useCallback(async () => {
    if (!endCursor) {
      return;
    }

    try {
      await fetchMore({
        variables: { ...variables, after: endCursor },
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
    } catch (error) {
      // Apollo does not set the query-level ``error`` for a failed ``fetchMore``.
      // NOTE: the activity-log hardening follow-up adds a visible load-more
      // error state; until then a failed page load is logged only.
      console.error('Failed to load more audit activity', toError(error));
    }
  }, [endCursor, fetchMore, variables]);

  /** Re-run the first page (after a failed load), surfacing failures via `error`. */
  const retry = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      // `refetch` rejects as well as setting `error`; swallow the rejection so an
      // unhandled promise cannot escape from the retry button.
      console.error('Failed to reload audit activity', toError(error));
    }
  }, [refetch]);

  return {
    actions,
    loading: loading && !data,
    loadingMore: loading && Boolean(data),
    error,
    hasMore,
    loadMore,
    retry,
  };
}
