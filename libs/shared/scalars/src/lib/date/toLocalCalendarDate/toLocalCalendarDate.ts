/**
 * @name toLocalCalendarDate
 *
 * @returns Date | undefined
 *
 * Converts a string or Date-like input into a local Date that represents
 * the same *calendar day* (year, month, and day) in the user's local time zone.
 *
 * Use for "date-only" values such as birthdays, due dates, or form inputs
 * that should stay the same calendar day everywhere.
 *
 * Example:
 *   toLocalCalendarDate("2026-05-21") → Date(2026, 4, 21, 00:00 local time)
 */

import { isValid, startOfDay } from 'date-fns';
import { isoToDateSafe } from '../isoToDateSafe';

export function toLocalCalendarDate(
  value?: string | Date | null,
): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return isValid(value) ? startOfDay(value) : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = isoToDateSafe(value);

  return parsed ? startOfDay(parsed) : undefined;
}
