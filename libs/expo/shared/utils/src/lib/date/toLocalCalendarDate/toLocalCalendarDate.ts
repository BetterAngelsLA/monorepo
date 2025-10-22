/**
 * @name toLocalCalendarDate
 *
 * @returns Date | undefined
 *
 * Converts a string or Date-like input into a local Date that represents
 * the same *calendar day* (year, month, and day) in the user's local time zone.
 *
 * This avoids the common issue where plain ISO strings like "2026-05-21"
 * are interpreted as UTC midnight and may shift to the previous or next day
 * when converted to a JavaScript Date in certain time zones.
 *
 * Example:
 *   toLocalCalendarDate("2026-05-21") → Date(2026, 4, 21, 00:00 local time)
 *
 * Use for "date-only" values such as birthdays, due dates, or form inputs
 * that should stay the same calendar day everywhere.
 */

import { isValid, parse } from 'date-fns';
import { isoToDateSafe } from '../isoToDateSafe';

export function toLocalCalendarDate(
  value?: string | Date | null,
  inputFormat?: string
): Date | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  // is Date
  if (value instanceof Date) {
    if (!isValid(value)) {
      return undefined;
    }

    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  // value is a string
  const trimmed = value.trim();

  // Try ISO first
  const validIsoDate = isoToDateSafe(trimmed);

  if (validIsoDate) {
    return new Date(
      validIsoDate.getFullYear(),
      validIsoDate.getMonth(),
      validIsoDate.getDate()
    );
  }

  // Try custom format
  if (inputFormat) {
    const parsed = parse(trimmed, inputFormat, new Date());

    if (isValid(parsed)) {
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }
  }

  return undefined;
}
