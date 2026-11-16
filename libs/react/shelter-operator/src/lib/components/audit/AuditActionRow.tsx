import { mergeCss } from '@monorepo/react/shared';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import type { AuditAction } from '../../hooks';
import { AuditEventRow } from './AuditEventRow';
import { AuditChangesView } from './AuditChangesView';
import { AuditScheduleEvent } from './AuditScheduleEvent';
import {
  formatScheduleEvent,
  isScheduleEvent,
  withoutScheduleChanges,
  type ScheduleChangeTone,
} from './auditSchedule';
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

/**
 * Removals first, then changes, then additions: one save reads as what was there,
 * what moved, and what is new — the order the field-change view already uses for
 * its own Removed/Added pairs.
 */
const TONE_ORDER: Record<ScheduleChangeTone, number> = {
  removed: 0,
  changed: 1,
  added: 2,
};

export function AuditActionRow({ action }: { action: AuditAction }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const hasEvents = action.events.length > 0;

  // Each schedule row renders as one line instead of a column-by-column diff
  // whose every pair has a null side. The same lines replace the merged changes
  // those rows contributed to the card — but only when *every* schedule row got
  // a line: an unlabelled row (written before the server sent the slot identity)
  // has no line, and stripping its change would hide it altogether.
  const { scheduleLines, everyScheduleRowRendered } = useMemo(() => {
    const entries = action.events.map((event, index) => ({
      index,
      schedule: isScheduleEvent(event),
      line: formatScheduleEvent(event),
    }));

    const lines = entries
      .filter(
        (
          entry,
        ): entry is {
          index: number;
          schedule: true;
          line: NonNullable<ReturnType<typeof formatScheduleEvent>>;
        } => entry.line !== null,
      )
      .sort(
        (a, b) =>
          TONE_ORDER[a.line.tone] - TONE_ORDER[b.line.tone] ||
          a.index - b.index,
      )
      .map((entry) => entry.line);

    return {
      scheduleLines: lines,
      everyScheduleRowRendered:
        lines.length > 0 &&
        entries.every((entry) => !entry.schedule || entry.line !== null),
    };
  }, [action.events]);

  const otherChanges = useMemo(
    () =>
      everyScheduleRowRendered
        ? withoutScheduleChanges(action.fieldChanges)
        : action.fieldChanges,
    [action.fieldChanges, everyScheduleRowRendered],
  );

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

      {scheduleLines.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {scheduleLines.map((line, index) => (
            <AuditScheduleEvent key={`${index}-${line.text}`} line={line} />
          ))}
        </div>
      )}

      <AuditChangesView value={otherChanges} className="mt-3" />

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
