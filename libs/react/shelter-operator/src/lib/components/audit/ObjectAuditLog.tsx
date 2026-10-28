import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { LoadingView } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useObjectAuditLog } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Text } from '../base-ui/text/text';
import { AuditActionRow } from './AuditActionRow';

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
  const { actions, loading, loadingMore, error, hasMore, loadMore } =
    useObjectAuditLog({ targetType, objectId });

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

    const loadMoreLabel = loadingMore ? 'Loading...' : 'Load more';

    return (
      <div className="flex flex-col gap-3">
        {actions.map((action, index) => (
          <AuditActionRow
            key={`${action.timestamp}-${index}`}
            action={action}
          />
        ))}

        {actions.length === 0 && !hasMore && (
          <div className="py-16 text-center">
            <Text variant="body" textColor="text-neutral-50">
              No activity yet.
            </Text>
          </div>
        )}

        {hasMore && (
          <div className="flex flex-col items-center gap-2 pt-2">
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
      {renderContent()}
    </div>
  );
}
