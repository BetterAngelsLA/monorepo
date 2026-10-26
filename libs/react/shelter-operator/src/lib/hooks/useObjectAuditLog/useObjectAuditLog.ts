import { useCallback, useMemo } from 'react';
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
 */
export function useObjectAuditLog({
  targetType,
  objectId,
  pageSize = DEFAULT_PAGE_SIZE,
  dateFrom,
  dateTo,
  actorId,
}: UseObjectAuditLogArgs) {
  const variables = useMemo<ObjectAuditLogQueryVariables>(() => {
    const filters: NonNullable<ObjectAuditLogQueryVariables['filters']> = {};

    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    if (actorId) {
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
  }, [targetType, objectId, dateFrom, dateTo, actorId, pageSize]);

  const { data, loading, error, fetchMore } = useQuery<
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
  }, [endCursor, fetchMore, variables]);

  return {
    actions,
    loading: loading && !data,
    loadingMore: loading && Boolean(data),
    error,
    hasMore,
    loadMore,
  };
}
