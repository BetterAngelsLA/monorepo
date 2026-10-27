import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { LoadingView } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useCallback, useMemo, useState } from 'react';
import { useObjectAuditLog, type ObjectAuditLogFilters } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Text } from '../base-ui/text/text';
import { AuditActionRow } from './AuditActionRow';
import { AuditFilterBar } from './AuditFilterBar';
import { hasRenderableContent } from './auditChanges';

type ObjectAuditLogProps = {
  targetType: AuditTargetType;
  objectId: string;
  className?: string;
};

/**
 * Generic, read-only audit log for a single object, keyed by target type so it
 * can be mounted for shelters, beds, and rooms. Bed/Room writes appear on the
 * shelter log as one-line summaries; their own logs carry the detail.
 */
export function ObjectAuditLog({
  targetType,
  objectId,
  className,
}: ObjectAuditLogProps) {
  const [filters, setFilters] = useState<ObjectAuditLogFilters>({});
  const {
    actions,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
  } = useObjectAuditLog({ targetType, objectId, ...filters });

  // An action with nothing to render (e.g. an unchanged schedule save netted to
  // zero events) is a blank card; drop it from the list.
  const visibleActions = useMemo(
    () => actions.filter(hasRenderableContent),
    [actions],
  );

  const handleFilterChange = useCallback((next: ObjectAuditLogFilters) => {
    setFilters(next);
  }, []);

  const renderContent = () => {
    if (loading) {
      return <LoadingView className="py-16" />;
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <Text variant="body" textColor="text-red-700">
            Unable to load activity. Please try again.
          </Text>
        </div>
      );
    }

    let loadMoreLabel = 'Load more';
    if (loadingMore) {
      loadMoreLabel = 'Loading...';
    } else if (loadMoreError) {
      loadMoreLabel = 'Retry';
    }

    return (
      <div className="flex flex-col gap-3">
        {visibleActions.map((action, index) => (
          <AuditActionRow
            key={`${action.timestamp}-${index}`}
            action={action}
          />
        ))}

        {visibleActions.length === 0 && !hasMore && (
          <div className="py-16 text-center">
            <Text variant="body" textColor="text-neutral-50">
              No activity yet.
            </Text>
          </div>
        )}

        {hasMore && (
          <div className="flex flex-col items-center gap-2 pt-2">
            {loadMoreError && (
              <Text variant="caption" textColor="text-red-700">
                Unable to load more activity.
              </Text>
            )}
            <Button
              variant="primary"
              color="blue"
              disabled={loadingMore}
              onClick={() => {
                void loadMore();
              }}
            >
              {loadMoreLabel}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={mergeCss(['flex flex-col gap-4', className])}>
      <AuditFilterBar onChange={handleFilterChange} />
      {renderContent()}
    </div>
  );
}
