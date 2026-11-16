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

/** True when the event describes a schedule slot: an add, a remove, or a time change. */
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
 * The side of a pair that exists. An add carries only the new value and a remove
 * only the old one (§13); an update carries both.
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
  const from = clock(start);
  const to = clock(end);

  // An exception with no times closes the whole day; two dashes would read as
  // missing data rather than "all day".
  return from === null && to === null
    ? 'all day'
    : `${from ?? '\u2014'} - ${to ?? '\u2014'}`;
}

/** `2026-12-25`, or `2026-12-24 - 2026-12-26` when the exception spans days. */
function dateSpan(start: string | null, end: string | null): string | null {
  if (!start) {
    return null;
  }

  return end && end !== start ? `${start} - ${end}` : start;
}

/**
 * One-line form of a schedule event:
 * `Added Operating Hours: Thursday 06:00 - 16:00`.
 *
 * Every field of an added or removed row has exactly one side, so rendering it as
 * a `before → after` pair (what the field-change view does) spends a line per
 * column to say what the slot is. The line keeps what a reader needs — direction,
 * type, when the slot applies (`Wednesday`, `2026-12-25`, or `all day`), the
 * exception flag and the time window — and drops the row id and the owning
 * shelter, which are the same for every slot in the action.
 *
 * A time change has two real sides, so it keeps an arrow inside the same
 * one-line shape.
 *
 * The identity comes from `context` (day and type for a weekly slot; the dates and
 * exception flag for an exception) or, for an add or a remove, from the row's own
 * one-sided fields. `condition` and `demographic` are not part of this line.
 *
 * An `UPDATE` with no `context` predates the current server (which always sends
 * the slot identity for one). It carries no identity and often only one side of
 * the window, so this returns `null` and the caller renders the field changes it
 * does have rather than an invented "Every day".
 */
export function formatScheduleEvent(
  event: Pick<AuditEvent, 'action' | 'kind' | 'fieldChanges' | 'context'>,
): ScheduleChangeLine | null {
  if (!isScheduleEvent(event)) {
    return null;
  }

  const changes = event.fieldChanges;
  const context = (event.context ?? {}) as Record<string, unknown>;

  // A time change carries its slot identity in `context`; an add or a remove
  // carries it as one-sided field changes, where an absent `day` genuinely means
  // the slot has no day. An `UPDATE` with neither is unlabelled, not day-less.
  const identityKnown =
    changeText(changes, 'day') !== null ||
    Object.prototype.hasOwnProperty.call(context, 'day') ||
    context['is exception'] === true;

  if (event.kind === AuditEventKind.Update && !identityKnown) {
    return null;
  }

  const scheduleType =
    changeText(changes, 'schedule type') ??
    contextText(context, 'schedule type') ??
    'Schedule';

  const exceptionPair = scalarPair(changes, 'is exception');
  const isException =
    exceptionPair !== null
      ? exceptionPair[0] === true || exceptionPair[1] === true
      : context['is exception'] === true;

  // An exception is scoped by its dates, so its dates are the "when"; a weekly
  // slot is scoped by its day. A day-less weekly slot applies every day.
  const exceptionDates = isException
    ? dateSpan(
        changeText(changes, 'start date') ?? contextText(context, 'start date'),
        changeText(changes, 'end date') ?? contextText(context, 'end date'),
      )
    : null;
  const day =
    changeText(changes, 'day') ?? contextText(context, 'day') ?? 'Every day';
  const when = exceptionDates ?? day;

  // Type first, then the day: a reader scanning the log groups by what kind of
  // hours changed before which day it was.
  const label = `${scheduleType}${isException ? ' (Exception)' : ''}`;

  if (event.kind === AuditEventKind.Insert) {
    return {
      tone: 'added',
      text: `Added ${label}: ${when} ${windowOf(
        changeValue(changes, 'start time'),
        changeValue(changes, 'end time'),
      )}`,
    };
  }

  if (event.kind === AuditEventKind.Delete) {
    return {
      tone: 'removed',
      text: `Removed ${label}: ${when} ${windowOf(
        changeValue(changes, 'start time'),
        changeValue(changes, 'end time'),
      )}`,
    };
  }

  const startPair = scalarPair(changes, 'start time');
  const endPair = scalarPair(changes, 'end time');

  // A real update carries only the fields that changed, so a one-sided edit has
  // one bound and no other. Printing two dashed windows would read as if the
  // rest of the window were missing, so name the bound that moved instead.
  if (startPair === null || endPair === null) {
    const [field, pair] =
      startPair !== null
        ? (['start time', startPair] as const)
        : (['end time', endPair] as const);

    if (pair === null) {
      return null;
    }

    return {
      tone: 'changed',
      text: `Changed ${label}: ${when} ${field} ${clock(pair[0]) ?? '\u2014'} \u2192 ${clock(pair[1]) ?? '\u2014'}`,
    };
  }

  return {
    tone: 'changed',
    text: `Changed ${label}: ${when} ${windowOf(
      startPair[0],
      endPair[0],
    )} \u2192 ${windowOf(startPair[1], endPair[1])}`,
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
