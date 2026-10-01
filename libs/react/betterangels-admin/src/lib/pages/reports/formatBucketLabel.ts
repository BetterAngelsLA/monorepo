import { parseDateString } from '@monorepo/shared/scalars';
import type { DateString } from '@monorepo/shared/scalars';

/**
 * Format a ``YYYY-MM-DD`` bucket label for the charts.
 *
 * ``new Date('2025-01-31')`` anchors to UTC midnight, which renders as the
 * previous day anywhere west of UTC — the opposite of the calendar the backend
 * cut the bucket from.  Anchor on the local calendar instead.
 */
export const formatBucketLabel = (value: string): string => {
  const date = parseDateString(value as DateString);

  return date ? `${date.getMonth() + 1}/${date.getDate()}` : value;
};
