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

function RetryButton({ onRetry }: { onRetry: () => Promise<void> }) {
  return (
    <Button
      variant="primary-sm"
      color="blue"
      className="mt-3"
      onClick={() => {
        void onRetry();
      }}
    >
      Try again
    </Button>
  );
}

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
  const { actions, loading, loadingMore, error, hasMore, loadMore, retry } =
    useObjectAuditLog({ targetType, objectId });

  const hasActions = actions.length > 0;

  const renderContent = () => {
    if (loading) {
      return <LoadingView className="py-16" />;
    }

    // Only replace the list with an error when there is nothing cached to show:
    // a failed refresh must not hide activity that is still usable.
    if (error && !hasActions) {
      return (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4"
        >
          <Text variant="body" textColor="text-red-700">
            Unable to load activity.
          </Text>
          <RetryButton onRetry={retry} />
        </div>
      );
    }

    const loadMoreLabel = loadingMore ? 'Loading...' : 'Load more';

    return (
      <div className="flex flex-col gap-3">
        {error && hasActions && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <Text variant="caption" textColor="text-red-700">
              Couldn&rsquo;t refresh activity.
            </Text>
            <Button
              variant="primary-sm"
              color="blue"
              onClick={() => {
                void retry();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* NOTE: withheld Bed/Room models are pruned in SQL, so they do not
            create empty actions. The empty-action case is a write netted to
            nothing: saving Operating Hours with no real schedule change still
            deletes and re-creates the rows, netting correctly emits no events,
            and the action comes back with an empty `events` list. The
            activity-log hardening follow-up hides those contentless cards. */}
        {actions.map((action, index) => (
          <AuditActionRow
            key={`${action.timestamp}-${index}`}
            action={action}
          />
        ))}

        {!hasActions && !hasMore && (
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
