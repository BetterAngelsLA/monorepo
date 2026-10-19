import { mergeCss } from '@monorepo/react/shared';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { AuditAction } from '../../hooks';
import { AuditEventRow } from './AuditEventRow';
import { AuditChangesView } from './AuditChangesView';
import {
  formatAuditTimestamp,
  formatAuditTimestampAbsolute,
} from './auditTime';
import { Text } from '../base-ui/text/text';

/** One grouped action (all events written under a single request context). */
export function AuditActionRow({ action }: { action: AuditAction }) {
  const [expanded, setExpanded] = useState(false);
  const hasEvents = action.events.length > 0;

  // The merged action-level changes belong to one subject; use its action so
  // schedule actions get day/type pinned and no-op fields dropped.
  const subjectAction = action.events.find((event) =>
    event.action.startsWith('shelter.schedule'),
  )?.action;

  // Summarized events (§32) are one-liners, not field changes: a shelter action
  // that only touches a bed would otherwise render an empty card body.
  const summaries = action.events
    .map((event) => event.summary)
    .filter((summary): summary is string => Boolean(summary));

  return (
    <div className="rounded-2xl border border-neutral-90 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Text variant="body-bold" textColor="text-neutral-20">
            {action.actor}
          </Text>
          <Text
            variant="caption"
            textColor="text-neutral-50"
            title={formatAuditTimestampAbsolute(action.timestamp)}
          >
            {formatAuditTimestamp(action.timestamp)}
          </Text>
        </div>

        {hasEvents && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className={mergeCss([
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs text-neutral-50',
              'cursor-pointer transition-colors hover:bg-neutral-99 hover:text-neutral-20',
            ])}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {expanded ? 'Hide details' : 'Details'}
          </button>
        )}
      </div>

      {summaries.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {summaries.map((summary, index) => (
            <Text
              key={`${summary}-${index}`}
              variant="body"
              textColor="text-neutral-20"
            >
              {summary}
            </Text>
          ))}
        </div>
      )}

      <AuditChangesView
        value={action.fieldChanges}
        action={subjectAction}
        className="mt-3"
      />

      {expanded && hasEvents && (
        <div className="mt-2 flex flex-col">
          {action.events.map((event, index) => (
            <AuditEventRow key={index} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
