import { AuditEventKind } from '@monorepo/ba-platform/types';
import type { AuditEvent } from '../../hooks';

const SCHEDULE_ACTION_PREFIX = 'shelter.schedule';

/**
 * The action-level key shape of a schedule row's change: the backend qualifies a
 * related row as `<Model> <id> <field>` (§13), which is how a card recognises the
 * entries its one-line form replaces.
 */
const SCHEDULE_ACTION_CHANGE_KEY = /^Schedule \d+ /;

export type ScheduleChangeTone = 'added' | 'removed' | 'changed';

export type ScheduleChangeLine = {
  tone: ScheduleChangeTone;
  text: string;
};

/** True when the event describes a schedule slot: an add, a remove, or a netted time change. */
export function isScheduleEvent(event: { action: string }): boolean {
  return event.action.startsWith(SCHEDULE_ACTION_PREFIX);
}

type ScalarPair = readonly [unknown, unknown];

/**
 * The `[old, new]` pair for one display-named field.
 *
 * ``null`` for a multi-value change (``[[removed], [added]]``), which a schedule
 * slot cannot have, and for a field the event does not carry.
 */
function scalarPair(changes: unknown, field: string): ScalarPair | null {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return null;
  }

  const raw = (changes as Record<string, unknown>)[field];

  if (!Array.isArray(raw) || raw.length !== 2) {
    return null;
  }

  const [oldValue, newValue] = raw as unknown as ScalarPair;

  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    return null;
  }

  return [oldValue, newValue];
}

/**
 * The side of a pair that exists. A slot is replaced, never edited in place, so
 * an add carries only the new value and a remove only the old one (§13).
 */
function definedSide([oldValue, newValue]: ScalarPair): unknown {
  return newValue === null || newValue === undefined ? oldValue : newValue;
}

function changeValue(changes: unknown, field: string): unknown {
  const pair = scalarPair(changes, field);

  return pair === null ? null : definedSide(pair);
}

function changeText(changes: unknown, field: string): string | null {
  const value = changeValue(changes, field);

  return typeof value === 'string' && value !== '' ? value : null;
}

/** A `context` entry is a plain value, not an `[old, new]` pair. */
function contextText(
  context: Record<string, unknown>,
  field: string,
): string | null {
  const value = context[field];

  return typeof value === 'string' && value !== '' ? value : null;
}

/** `06:00:00` -> `06:00`. Minutes are kept; non-zero seconds are not rounded away. */
function clock(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  return value.replace(/:00$/, '');
}

function windowOf(start: unknown, end: unknown): string {
  return `${clock(start) ?? '\u2014'} - ${clock(end) ?? '\u2014'}`;
}

/**
 * One-line form of a schedule event:
 * `Added Operating Hours: Thursday 06:00 - 16:00`.
 *
 * A schedule save replaces the whole slot set, so every field of an added or
 * removed row has exactly one side: rendering it as a `before → after` pair (what
 * the field-change view does) spends a line per column to say what the slot is.
 * The line keeps what a reader needs — direction, day, type, the exception flag
 * and the time window — and drops the row id and the owning shelter, which are
 * the same for every slot in the action.
 *
 * A netted time change is the one case with two real sides, so it keeps an arrow
 * inside the same one-line shape.
 *
 * NOTE: `context` carries the day and type of a netted change but not the
 * exception flag (it is part of the netting identity, so it never changes there),
 * so a changed line cannot mark an exception slot. `start date`, `end date`,
 * `condition` and `demographic` are likewise not part of this line.
 */
export function formatScheduleEvent(
  event: Pick<AuditEvent, 'action' | 'kind' | 'fieldChanges' | 'context'>,
): ScheduleChangeLine | null {
  if (!isScheduleEvent(event)) {
    return null;
  }

  const changes = event.fieldChanges;
  const context = (event.context ?? {}) as Record<string, unknown>;

  const day =
    changeText(changes, 'day') ?? contextText(context, 'day') ?? 'Every day';
  const scheduleType =
    changeText(changes, 'schedule type') ??
    contextText(context, 'schedule type') ??
    'Schedule';

  const exceptionPair = scalarPair(changes, 'is exception');
  const isException =
    exceptionPair !== null &&
    (exceptionPair[0] === true || exceptionPair[1] === true);

  // Type first, then the day: a reader scanning the log groups by what kind of
  // hours changed before which day it was.
  const label = `${scheduleType}${isException ? ' (Exception)' : ''}`;

  if (event.kind === AuditEventKind.Insert) {
    return {
      tone: 'added',
      text: `Added ${label}: ${day} ${windowOf(
        changeValue(changes, 'start time'),
        changeValue(changes, 'end time'),
      )}`,
    };
  }

  if (event.kind === AuditEventKind.Delete) {
    return {
      tone: 'removed',
      text: `Removed ${label}: ${day} ${windowOf(
        changeValue(changes, 'start time'),
        changeValue(changes, 'end time'),
      )}`,
    };
  }

  const startPair = scalarPair(changes, 'start time');
  const endPair = scalarPair(changes, 'end time');

  return {
    tone: 'changed',
    text: `Changed ${label}: ${day} ${windowOf(
      startPair?.[0],
      endPair?.[0],
    )} \u2192 ${windowOf(startPair?.[1], endPair?.[1])}`,
  };
}

/**
 * Drop the changes owned by a schedule row, which render as one line per slot.
 *
 * Without this a card would print both the line and the column-by-column diff it
 * replaces, including the row id and shelter name the line exists to remove.
 */
export function withoutScheduleChanges(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([field]) => !SCHEDULE_ACTION_CHANGE_KEY.test(field),
    ),
  );
}
