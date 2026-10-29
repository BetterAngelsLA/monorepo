import { mergeCss } from '@monorepo/react/shared';
import type { ReactNode } from 'react';
import { Text } from '../base-ui/text/text';
import {
  displayOptionsForAction,
  formatValue,
  parseFieldChanges,
  truncateValue,
  type AuditChange,
} from './auditChanges';

/** The full value goes in the tooltip; the inline text is capped. */
function displayValue(value: unknown): { text: string; title: string } {
  const full = formatValue(value);

  return { text: truncateValue(full), title: full };
}

function renderChange(change: AuditChange): ReactNode {
  if (change.kind === 'multi') {
    const removed = change.removed.map(formatValue).join(', ');
    const added = change.added.map(formatValue).join(', ');

    return (
      <div key={change.field} className="flex flex-col gap-0.5 py-0.5">
        <Text variant="caption" textColor="text-neutral-50">
          {change.label}
        </Text>

        {change.removed.length > 0 && (
          <Text
            variant="caption"
            textColor="text-alert-60"
            title={`Removed: ${removed}`}
          >
            Removed: {truncateValue(removed)}
          </Text>
        )}

        {change.added.length > 0 && (
          <Text
            variant="caption"
            textColor="text-success-30"
            title={`Added: ${added}`}
          >
            Added: {truncateValue(added)}
          </Text>
        )}
      </div>
    );
  }

  const oldValue = displayValue(change.oldValue);
  const newValue = displayValue(change.newValue);

  return (
    <div
      key={change.field}
      className="flex flex-wrap items-baseline gap-x-1.5 py-0.5"
    >
      <Text variant="caption" textColor="text-neutral-50">
        {change.label}:
      </Text>
      <Text
        variant="caption"
        textColor="text-neutral-50"
        title={oldValue.title}
      >
        {oldValue.text}
      </Text>
      <span aria-hidden="true" className="text-neutral-40">
        &rarr;
      </span>
      <Text
        variant="caption"
        textColor="text-neutral-20"
        title={newValue.title}
      >
        {newValue.text}
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
  action,
  className,
}: {
  value: unknown;
  action?: string;
  className?: string;
}) {
  const changes = parseFieldChanges(value, displayOptionsForAction(action));

  if (changes.length === 0) {
    return null;
  }

  return (
    <div className={mergeCss(['flex flex-col', className])}>
      {changes.map(renderChange)}
    </div>
  );
}
