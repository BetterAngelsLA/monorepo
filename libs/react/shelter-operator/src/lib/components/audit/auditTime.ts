import { formatDistanceToNow } from 'date-fns';
import { isoToDateSafe } from '@monorepo/shared/scalars';

/** Relative timestamp for inline display, e.g. "3 hours ago". */
export function formatAuditTimestamp(value: string | null | undefined): string {
  const date = isoToDateSafe(value);

  return date ? formatDistanceToNow(date, { addSuffix: true }) : '';
}

/** Absolute timestamp for a `title` tooltip. */
export function formatAuditTimestampAbsolute(
  value: string | null | undefined,
): string {
  const date = isoToDateSafe(value);

  return date ? date.toLocaleString() : '';
}
