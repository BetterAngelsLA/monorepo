import { isoToDateSafe } from '@monorepo/shared/scalars';

/** Localized date and time with seconds, e.g. "10/28/2026, 2:03:41 PM". */
const LOCAL_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
};

function formatLocalDateTime(date: Date): string {
  return date.toLocaleString(undefined, LOCAL_DATE_TIME_OPTIONS);
}

/** Full localized timestamp for inline display. */
export function formatAuditTimestamp(value: string | null | undefined): string {
  const date = isoToDateSafe(value);

  return date ? formatLocalDateTime(date) : '';
}

/** Full localized timestamp for the `title` tooltip. */
export function formatAuditTimestampAbsolute(
  value: string | null | undefined,
): string {
  const date = isoToDateSafe(value);

  return date ? formatLocalDateTime(date) : '';
}
