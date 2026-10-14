import { isoToDateSafe } from '@monorepo/shared/scalars';
import { differenceInCalendarDays } from 'date-fns';

/**
 * Whether a Clarity date has been reached: `true` for today and past dates,
 * `false` for future dates and missing/unparseable values.
 *
 * Calendar-day comparison (matching `humanizeDateHmisProd`), so a date that
 * includes a time part still counts once its calendar day arrives.
 *
 * `now` is injectable for tests.
 */
export function hasStartedHmisProd(
  value?: string | null,
  now: Date = new Date(),
): boolean {
  const date = isoToDateSafe(value);

  return !!date && differenceInCalendarDays(now, date) >= 0;
}
