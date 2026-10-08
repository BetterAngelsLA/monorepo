import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  ObjectAuditLogDocument,
  type ObjectAuditLogQuery,
  type ObjectAuditLogQueryVariables,
} from './__generated__/useObjectAuditLog.generated';

export type AuditAction = ObjectAuditLogQuery['objectAuditLog'][number];
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
 * Fetches the grouped audit actions for one object. The API returns a plain
 * list (no total count), so "more" is inferred from page sizes.
 *
 * Date/actor filters are applied server-side; changing them restarts
 * pagination from the first page.
 */
export function useObjectAuditLog({
  targetType,
  objectId,
  pageSize = DEFAULT_PAGE_SIZE,
  dateFrom,
  dateTo,
  actorId,
}: UseObjectAuditLogArgs) {
  const variables = useMemo(
    () => ({
      targetType,
      objectId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      actorId: actorId || undefined,
      limit: pageSize,
      offset: 0,
    }),
    [targetType, objectId, dateFrom, dateTo, actorId, pageSize],
  );

  const { data, loading, error, fetchMore } = useQuery<
    ObjectAuditLogQuery,
    ObjectAuditLogQueryVariables
  >(ObjectAuditLogDocument, {
    variables,
    skip: !objectId,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const actions = useMemo(() => data?.objectAuditLog ?? [], [data]);

  const [hasMore, setHasMore] = useState(false);
  const firstPageResolved = useRef(false);

  // Restart pagination whenever the query (object or filters) changes.
  useEffect(() => {
    firstPageResolved.current = false;
    setHasMore(false);
  }, [targetType, objectId, dateFrom, dateTo, actorId, pageSize]);

  // A full first page implies there may be more; a short page means the end.
  useEffect(() => {
    if (!data || firstPageResolved.current) {
      return;
    }
    firstPageResolved.current = true;
    setHasMore(data.objectAuditLog.length === pageSize);
  }, [data, pageSize]);

  const loadMore = useCallback(async () => {
    const result = await fetchMore({
      variables: { ...variables, offset: actions.length },
      updateQuery: (previous, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return previous;
        }

        return {
          ...previous,
          objectAuditLog: [
            ...previous.objectAuditLog,
            ...fetchMoreResult.objectAuditLog,
          ],
        };
      },
    });

    const nextPage = result.data?.objectAuditLog ?? [];
    if (nextPage.length < pageSize) {
      setHasMore(false);
    }
  }, [fetchMore, variables, pageSize, actions.length]);

  return {
    actions,
    loading: loading && !data,
    loadingMore: loading && Boolean(data),
    error,
    hasMore,
    loadMore,
  };
}
