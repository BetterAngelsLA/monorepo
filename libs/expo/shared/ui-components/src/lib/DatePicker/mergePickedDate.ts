import { isValid, parse } from 'date-fns';

/**
 * Merge a value picked from a native `<input type="date" | "time">` into the
 * field's current value.
 *
 * Extracted from the web date field so the rule can be tested without a DOM —
 * it is a product rule, not a detail of the input element.
 *
 * Returns `null` when there is nothing usable to apply: an empty input (clearing
 * the native control must not silently wipe a required value — the numeric
 * variant owns clear behaviour via `onDelete`) or an unparseable one.
 *
 * `now` is injected so tests do not depend on the clock.
 */
export function mergePickedDate(
  raw: string,
  mode: 'date' | 'time',
  value: Date | null | undefined,
  now: Date,
  format: string,
): Date | null {
  if (!raw) {
    return null;
  }

  const parsed = parse(raw, format, now);
  if (!isValid(parsed)) {
    return null;
  }

  // Preserve the half of the value the user did not edit: changing only the time
  // must not reset the date, and vice versa.
  //
  // With no prior value `base` is "now", so a date-only pick carries the current
  // clock time — matching native, which seeds its picker with `value || new
  // Date()` and passes that Date straight through.
  const base = value && isValid(value) ? value : now;
  const next = new Date(parsed);

  if (mode === 'time') {
    next.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
  } else {
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
  }

  return next;
}
