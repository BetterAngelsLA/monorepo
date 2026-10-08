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

type UseObjectAuditLogArgs = {
  targetType: ObjectAuditLogQueryVariables['targetType'];
  objectId: string;
  pageSize?: number;
};

/**
 * Fetches the grouped audit actions for one object. The API returns a plain
 * list (no total count), so "more" is inferred from page sizes.
 */
export function useObjectAuditLog({
  targetType,
  objectId,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseObjectAuditLogArgs) {
  const { data, loading, error, fetchMore } = useQuery<
    ObjectAuditLogQuery,
    ObjectAuditLogQueryVariables
  >(ObjectAuditLogDocument, {
    variables: { targetType, objectId, limit: pageSize, offset: 0 },
    skip: !objectId,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const actions = useMemo(() => data?.objectAuditLog ?? [], [data]);

  const [hasMore, setHasMore] = useState(false);
  const firstPageResolved = useRef(false);

  // Reset pagination whenever the queried object changes.
  useEffect(() => {
    firstPageResolved.current = false;
    setHasMore(false);
  }, [targetType, objectId, pageSize]);

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
      variables: {
        targetType,
        objectId,
        limit: pageSize,
        offset: actions.length,
      },
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
  }, [fetchMore, targetType, objectId, pageSize, actions.length]);

  return {
    actions,
    loading: loading && !data,
    loadingMore: loading && Boolean(data),
    error,
    hasMore,
    loadMore,
  };
}
