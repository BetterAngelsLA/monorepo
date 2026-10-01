import { isoToDateSafe } from '@monorepo/shared/scalars';
import { differenceInCalendarDays, differenceInCalendarMonths } from 'date-fns';

const pluralize = (count: number, unit: string): string =>
  `${count} ${unit}${count === 1 ? '' : 's'}`;

/**
 * Humanize a Clarity date (`YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss`) for display
 * next to the absolute date: `today`, `yesterday`, `4 days ago`, `3 weeks
 * ago`, `2 months ago`, and `1 year 2 months ago` once past a year.
 *
 * `now` is injectable for tests. Unparseable values return `null`; future
 * dates (bad data) read as `today`.
 */
export function humanizeDateHmisProd(
  value?: string | null,
  now: Date = new Date(),
): string | null {
  const date = isoToDateSafe(value);

  if (!date) {
    return null;
  }

  const days = differenceInCalendarDays(now, date);

  if (days <= 0) {
    return 'today';
  }

  if (days === 1) {
    return 'yesterday';
  }

  if (days < 7) {
    return `${pluralize(days, 'day')} ago`;
  }

  const months = differenceInCalendarMonths(now, date);

  if (months < 1) {
    const weeks = Math.max(1, Math.floor(days / 7));

    return `${pluralize(weeks, 'week')} ago`;
  }

  if (months < 12) {
    return `${pluralize(months, 'month')} ago`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  return remainingMonths > 0
    ? `${pluralize(years, 'year')} ${pluralize(remainingMonths, 'month')} ago`
    : `${pluralize(years, 'year')} ago`;
}
