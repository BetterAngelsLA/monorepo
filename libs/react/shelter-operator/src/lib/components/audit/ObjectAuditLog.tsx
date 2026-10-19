import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { LoadingView } from '@monorepo/react/components';
import { useCallback, useState } from 'react';
import { useObjectAuditLog, type ObjectAuditLogFilters } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Text } from '../base-ui/text/text';
import { AuditActionRow } from './AuditActionRow';
import { AuditFilterBar } from './AuditFilterBar';

type ObjectAuditLogProps = {
  targetType: AuditTargetType;
  objectId: string;
};

/**
 * Generic, read-only audit log for a single object, keyed by target type so it
 * can be mounted for shelters, beds, and rooms. Bed/Room writes appear on the
 * shelter log as one-line summaries; their own logs carry the detail.
 */
export function ObjectAuditLog({ targetType, objectId }: ObjectAuditLogProps) {
  const [filters, setFilters] = useState<ObjectAuditLogFilters>({});
  const { actions, loading, loadingMore, error, hasMore, loadMore } =
    useObjectAuditLog({ targetType, objectId, ...filters });

  const handleFilterChange = useCallback((next: ObjectAuditLogFilters) => {
    setFilters(next);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <AuditFilterBar onChange={handleFilterChange} />

      {loading ? (
        <LoadingView className="py-16" />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <Text variant="body" textColor="text-red-700">
            Unable to load activity. Please try again.
          </Text>
        </div>
      ) : actions.length === 0 ? (
        <div className="py-16 text-center">
          <Text variant="body" textColor="text-neutral-50">
            No activity yet.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {actions.map((action, index) => (
            <AuditActionRow
              key={`${action.timestamp}-${index}`}
              action={action}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="primary"
                color="blue"
                disabled={loadingMore}
                onClick={() => {
                  void loadMore();
                }}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
