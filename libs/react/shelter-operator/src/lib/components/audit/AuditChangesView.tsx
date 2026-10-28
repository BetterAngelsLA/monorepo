import { mergeCss } from '@monorepo/react/shared';
import type { ReactNode } from 'react';
import { Text } from '../base-ui/text/text';
import {
  formatValue,
  parseFieldChanges,
  type AuditChange,
} from './auditChanges';

function renderChange(change: AuditChange): ReactNode {
  if (change.kind === 'multi') {
    return (
      <div key={change.field} className="flex flex-col gap-0.5 py-0.5">
        <Text variant="caption" textColor="text-neutral-50">
          {change.label}
        </Text>

        {change.removed.length > 0 && (
          <Text variant="caption" textColor="text-alert-60">
            Removed: {change.removed.map(formatValue).join(', ')}
          </Text>
        )}

        {change.added.length > 0 && (
          <Text variant="caption" textColor="text-success-30">
            Added: {change.added.map(formatValue).join(', ')}
          </Text>
        )}
      </div>
    );
  }

  return (
    <div
      key={change.field}
      className="flex flex-wrap items-baseline gap-x-1.5 py-0.5"
    >
      <Text variant="caption" textColor="text-neutral-50">
        {change.label}:
      </Text>
      <Text variant="caption" textColor="text-neutral-50">
        {formatValue(change.oldValue)}
      </Text>
      <span className="text-neutral-40">&rarr;</span>
      <Text variant="caption" textColor="text-neutral-20">
        {formatValue(change.newValue)}
      </Text>
    </div>
  );
}

/**
 * Renders an audit event's or action's `fieldChanges` JSON as a readable list.
 * Renders nothing when there are no changes.
 */
export function AuditChangesView({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  const changes = parseFieldChanges(value);

  if (changes.length === 0) {
    return null;
  }

  return (
    <div className={mergeCss(['flex flex-col', className])}>
      {changes.map(renderChange)}
    </div>
  );
}
