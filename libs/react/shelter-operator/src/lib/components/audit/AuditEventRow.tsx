import { AuditEventKind } from '@monorepo/ba-platform/types';
import { mergeCss } from '@monorepo/react/shared';
import type { AuditEvent } from '../../hooks';
import { AuditChangesView } from './AuditChangesView';
import { humanizeAction } from './auditChanges';
import {
  formatAuditTimestamp,
  formatAuditTimestampAbsolute,
} from './auditTime';
import { Text } from '../base-ui/text/text';

const KIND_META: Record<AuditEventKind, { label: string; className: string }> =
  {
    [AuditEventKind.Insert]: {
      label: 'Added',
      className: 'bg-emerald-100 text-emerald-800',
    },
    [AuditEventKind.Update]: {
      label: 'Changed',
      className: 'bg-sky-100 text-sky-800',
    },
    [AuditEventKind.Delete]: {
      label: 'Removed',
      className: 'bg-red-100 text-red-800',
    },
  };

/** One low-level event within a grouped action. */
export function AuditEventRow({ event }: { event: AuditEvent }) {
  const kind = KIND_META[event.kind] ?? {
    label: event.kind,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="flex flex-col gap-1 border-l-2 border-neutral-90 py-2 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={mergeCss([
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            kind.className,
          ])}
        >
          {kind.label}
        </span>

        <Text variant="body-bold" textColor="text-neutral-20">
          {event.summary ?? humanizeAction(event.action)}
        </Text>

        <Text
          variant="caption"
          textColor="text-neutral-50"
          title={formatAuditTimestampAbsolute(event.timestamp)}
        >
          {formatAuditTimestamp(event.timestamp)}
        </Text>
      </div>

      {!event.summary && <AuditChangesView value={event.fieldChanges} />}
    </div>
  );
}
