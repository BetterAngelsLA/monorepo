/**
 * Format a ``YYYY-MM-DD`` bucket label for the charts.
 *
 * The backend bucketed the note on the organization's calendar and already
 * encoded the answer in the string — ``2025-01-31`` means the 31st, full stop.
 * Reading that back through ``new Date(value)`` anchored it to UTC midnight, which
 * renders as the previous day anywhere west of UTC; ``parseDateString`` anchors to
 * *local* midnight instead, which renders correctly but makes the label depend on
 * the viewer's machine clock.
 *
 * Neither is needed.  The value is already a date, so read the digits and never
 * construct a ``Date`` — the label is then the same on every machine, which is
 * what the tests below assert.
 */
export const formatBucketLabel = (value: string): string => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  return parts ? `${Number(parts[2])}/${Number(parts[3])}` : value;
};
