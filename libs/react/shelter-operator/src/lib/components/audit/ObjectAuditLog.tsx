import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { LoadingView } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useCallback, useState } from 'react';
import { useObjectAuditLog, type ObjectAuditLogFilters } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Text } from '../base-ui/text/text';
import { AuditActionRow } from './AuditActionRow';
import { AuditFilterBar } from './AuditFilterBar';
import {
  hasDateBounds,
  initialAuditFilter,
  type AuditActorSelection,
} from './auditFilters';

/**
 * Filter state tagged with the target it was chosen on, so a different object
 * starts from the seeded window with no actor instead of inheriting one.
 */
type SeededFilters = {
  targetKey: string;
  filters: ObjectAuditLogFilters;
  actor: AuditActorSelection | null;
};

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
  // One clock read seeds both the query and the bar, so the window they show
  // and the window they request cannot disagree.
  const [initial] = useState(initialAuditFilter);
  const targetKey = `${targetType}:${objectId}`;
  const [seeded, setSeeded] = useState<SeededFilters>(() => ({
    targetKey,
    filters: initial.filters,
    actor: null,
  }));

  // A filter belongs to the object it was chosen on, and a target switch starts
  // both dimensions over: an actor from another object's history would silently
  // narrow this log, and a kept date range would make the query and the bar
  // disagree (the bar re-seeds from this mount-time range). Discarding the old
  // filters here — rather than only masking them while the key differs — is what
  // makes returning to an earlier target start fresh instead of reviving them.
  // Adjusting during render, not in an effect, keeps the reset values on the
  // render that issues the request.
  const isOtherTarget = seeded.targetKey !== targetKey;
  const current: SeededFilters = isOtherTarget
    ? { targetKey, filters: initial.filters, actor: null }
    : seeded;

  if (isOtherTarget) {
    setSeeded(current);
  }

  const seedFilter = useCallback(
    (patch: Partial<Pick<SeededFilters, 'filters' | 'actor'>>) => {
      setSeeded((previous) => ({ ...previous, ...patch }));
    },
    [],
  );

  const handleFilterChange = useCallback(
    (next: ObjectAuditLogFilters) => {
      seedFilter({ filters: next });
    },
    [seedFilter],
  );

  const handleActorSelectionChange = useCallback(
    (next: AuditActorSelection | null) => {
      seedFilter({ actor: next });
    },
    [seedFilter],
  );

  const {
    actions,
    loading,
    loadingMore,
    error,
    retryError,
    hasMore,
    loadMore,
    retry,
  } = useObjectAuditLog({ targetType, objectId, ...current.filters });

  const hasActions = actions.length > 0;
  const hasRefreshError = Boolean(error || retryError);

  const renderContent = () => {
    if (loading) {
      return <LoadingView className="py-16" />;
    }

    // Only replace the list with an error when there is nothing cached to show:
    // a failed refresh must not hide activity that is still usable.
    if (hasRefreshError && !hasActions) {
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
        {hasRefreshError && hasActions && (
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
              disabled={loadingMore}
              onClick={() => {
                // A replay failure leaves the failed page as the cache's next
                // cursor; retrying it must load that page, not run a full
                // refetch that only replays the pages that already succeeded.
                if (error) {
                  void retry();
                } else if (retryError) {
                  void loadMore();
                } else {
                  void retry();
                }
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
              {hasDateBounds(current.filters)
                ? 'No activity in the selected date range.'
                : 'No activity'}
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
      <AuditFilterBar
        key={targetKey}
        targetType={targetType}
        objectId={objectId}
        initialPreset={initial.preset}
        initialRange={initial.range}
        actorSelection={current.actor}
        onActorSelectionChange={handleActorSelectionChange}
        onChange={handleFilterChange}
      />
      {renderContent()}
    </div>
  );
}
