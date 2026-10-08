import { formatDistanceToNow, isValid, parseISO } from 'date-fns';

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = parseISO(value);

  return isValid(date) ? date : null;
}

/** Relative timestamp for inline display, e.g. "3 hours ago". */
export function formatAuditTimestamp(value: string | null | undefined): string {
  const date = toDate(value);

  return date ? formatDistanceToNow(date, { addSuffix: true }) : '';
}

/** Absolute timestamp for a `title` tooltip. */
export function formatAuditTimestampAbsolute(
  value: string | null | undefined,
): string {
  const date = toDate(value);

  return date ? date.toLocaleString() : '';
}
