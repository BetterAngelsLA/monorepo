import { mergeCss } from '@monorepo/react/shared';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import type { AuditAction } from '../../hooks';
import { AuditEventRow } from './AuditEventRow';
import { AuditChangesView } from './AuditChangesView';
import {
  AuditEventContext,
  formatAuditEventContext,
} from './AuditEventContext';
import { subjectActionFor } from './auditChanges';
import {
  formatAuditTimestamp,
  formatAuditTimestampAbsolute,
} from './auditTime';
import { Text } from '../base-ui/text/text';

/**
 * One grouped action (all events written under a single request context).
 *
 * NOTE: the activity-log hardening pass still owes `action.truncated` (the
 * server capped a bulk action's event list); until it lands a capped bulk action
 * renders only the rows the server returned.
 */
export function AuditActionRow({ action }: { action: AuditAction }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const hasEvents = action.events.length > 0;

  // The merged action-level changes belong to one subject; use its action for
  // schedule-specific display options. Its keys are qualified per row
  // (`Schedule 209 start time`), which `parseFieldChanges` matches by suffix.
  const subjectAction = subjectActionFor(action);

  // A netted schedule change carries the slot's unchanged identity (day/type) in
  // `context`. One action can cover several slots (Mon–Fri hours), so show each
  // distinct line rather than only the first. Keying on the rendered line also
  // drops events whose context has nothing to show, so an unrenderable context
  // cannot leave an empty gap in the card.
  const contexts = useMemo(() => {
    const byLine = new Map<string, unknown>();

    for (const event of action.events) {
      const line = formatAuditEventContext(event.context);

      if (line !== null && !byLine.has(line)) {
        byLine.set(line, event.context);
      }
    }

    return Array.from(byLine);
  }, [action.events]);

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
            aria-controls={expanded ? detailsId : undefined}
            className={mergeCss([
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs text-neutral-50',
              'cursor-pointer transition-colors hover:bg-neutral-99 hover:text-neutral-20',
            ])}
          >
            {expanded ? (
              <ChevronDown size={16} aria-hidden="true" />
            ) : (
              <ChevronRight size={16} aria-hidden="true" />
            )}
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

      {contexts.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {contexts.map(([line, context]) => (
            <AuditEventContext key={line} context={context} />
          ))}
        </div>
      )}

      <AuditChangesView
        value={action.fieldChanges}
        actionKey={subjectAction}
        className="mt-3"
      />

      {expanded && hasEvents && (
        <div id={detailsId} className="mt-2 flex flex-col">
          {action.events.map((event, index) => (
            <AuditEventRow key={index} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
