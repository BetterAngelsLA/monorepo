import { format } from 'date-fns';
import type { DateString, DateTimeString } from '../branded';
import { isoToDateSafe } from './isoToDateSafe';
import { toLocalCalendarDate } from './toLocalCalendarDate/toLocalCalendarDate';

const DATE_ONLY_PATTERN = 'yyyy-MM-dd';

/**
 * Serialize a `Date` for the `Date` GraphQL scalar.
 *
 * Uses the date's *local* parts. `toISOString().split('T')[0]` would shift the
 * day for anyone east of UTC.
 */
export function toDateString(date: Date): DateString {
  return format(date, DATE_ONLY_PATTERN);
}

/**
 * Parse a `Date` scalar into a `Date` anchored to local midnight.
 *
 * `new Date('2026-05-05')` would anchor to UTC midnight, which renders as the
 * previous day anywhere west of UTC.
 */
export function fromDateString(value?: DateString | null): Date | undefined {
  return toLocalCalendarDate(value ?? undefined);
}

/** Format a `Date` or `DateTime` scalar for display. `''` when unparseable. */
export function formatDateString(
  value: DateString | DateTimeString | null | undefined,
  pattern: string,
): string {
  const date = isoToDateSafe(value);

  return date ? format(date, pattern) : '';
}
