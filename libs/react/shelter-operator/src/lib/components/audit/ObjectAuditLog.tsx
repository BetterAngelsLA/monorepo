import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { LoadingView } from '@monorepo/react/components';
import { useObjectAuditLog } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Text } from '../base-ui/text/text';
import { AuditActionRow } from './AuditActionRow';

type ObjectAuditLogProps = {
  targetType: AuditTargetType;
  objectId: string;
};

/**
 * Generic, read-only audit log for a single object, keyed by target type so it
 * can be mounted for shelters (and later rooms, beds, reservations).
 */
export function ObjectAuditLog({ targetType, objectId }: ObjectAuditLogProps) {
  const { actions, loading, loadingMore, error, hasMore, loadMore } =
    useObjectAuditLog({ targetType, objectId });

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

  if (actions.length === 0) {
    return (
      <div className="py-16 text-center">
        <Text variant="body" textColor="text-neutral-50">
          No activity yet.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {actions.map((action, index) => (
        <AuditActionRow key={`${action.timestamp}-${index}`} action={action} />
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
  );
}
