import { isValid, parse } from 'date-fns';

/**
 * Merge a value picked from a native `<input type="date" | "time">` into the
 * field's current value.
 *
 * Extracted from the web date field so the rule can be tested without a DOM —
 * it is a product rule, not a detail of the input element, and it has already
 * been read the wrong way once ("a date-mode pick should yield midnight" is not
 * supported; see below).
 *
 * Returns `null` when there is nothing usable to apply: an empty input (clearing
 * the native control must not silently wipe a required value — the numeric
 * variant owns clear behaviour via `onDelete`) or an unparseable one.
 *
 * @param raw      the input's string value
 * @param mode     which half the control edits
 * @param value    the field's current value, if any
 * @param now      "now", injected so tests do not depend on the clock
 * @param format   the `date-fns` format the input's value uses
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
  // clock time. That is deliberate — the native picker is seeded with
  // `value || new Date()` and passes its Date straight through, so it does the
  // same. Do not "fix" this to midnight without checking both platforms first.
  const base = value && isValid(value) ? value : now;
  const next = new Date(parsed);

  if (mode === 'time') {
    next.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
  } else {
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
  }

  return next;
}
