/**
 * Format a ``YYYY-MM-DD`` bucket label for the charts.
 *
 * The backend bucketed the note on the organization's calendar and already put the
 * answer in the string — ``2025-01-31`` means the 31st, full stop.  There is no
 * instant here to interpret and no zone to apply.
 *
 * Deliberately not routed through ``@monorepo/shared/scalars``.  ``parseDateString``
 * anchors to *local* midnight, so it renders the right day but reads the machine's
 * clock to do it — which makes the output, and any test of it, dependent on where
 * the test runs.  ``new Date(value)`` is worse: it anchors to UTC midnight and
 * renders ``2025-01-31`` as the 30th west of UTC.  Reading the digits keeps the
 * label identical on every machine, so the old implementation fails the test on a
 * UTC CI runner instead of only on a developer's laptop.
 *
 * Anything not shaped like a date is passed through untouched.
 */
export const formatBucketLabel = (value: string): string => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  return parts ? `${Number(parts[2])}/${Number(parts[3])}` : value;
};
