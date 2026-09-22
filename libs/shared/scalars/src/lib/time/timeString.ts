import { format } from 'date-fns';
import type { TimeString } from '../branded';

const MINUTES_PER_DAY = 24 * 60;

/**
 * `HH:mm` or `HH:mm:ss`, and nothing else. Fractional seconds are tolerated
 * because Strawberry's `Time` scalar emits them whenever the stored value has
 * microseconds — `time(22, 0, 0, 500000)` serializes as `"22:00:00.500000"`.
 */
const TIME_PATTERN = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;

/**
 * A day with no UTC-offset change in any IANA zone, so a `Date` built from
 * wall-clock parts below always carries the time it was built with. On a
 * spring-forward day it would not: 02:30 does not exist, and the runtime
 * silently returns 03:30.
 */
const REFERENCE_YEAR = 2001;
const REFERENCE_MONTH = 5; // June
const REFERENCE_DAY = 15;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Serialize minutes-since-midnight for the `Time` GraphQL scalar.
 *
 * Clamped to 23:59 rather than 24:00, because `"24:00:00"` does not survive the
 * round trip: Python's `time.fromisoformat` folds it to midnight without
 * complaining, so a window ending at 24:00 comes back ending at 00:00 and reads
 * as finishing before it started.
 */
export function toTimeString(minutesSinceMidnight: number): TimeString {
  const total = Math.max(
    0,
    Math.min(MINUTES_PER_DAY - 1, Math.round(minutesSinceMidnight)),
  );

  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`;
}

/**
 * Parse a `Time` scalar into minutes since midnight. Seconds are dropped.
 *
 * Accepts `HH:mm` and `HH:mm:ss` within a single day and nothing else, so a
 * malformed value cannot arrive as `NaN` minutes, nor as an out-of-range number
 * that formats back out as a plausible-looking time.
 */
export function parseTimeString(value?: TimeString | null): number | undefined {
  const match = value?.trim().match(TIME_PATTERN);

  if (!match) {
    return undefined;
  }

  const minutes = Number(match[1]) * 60 + Number(match[2]);

  return minutes < MINUTES_PER_DAY ? minutes : undefined;
}

/**
 * Format a `Time` scalar for display, e.g. `formatTimeString(curfew, 'h:mm a')`.
 * Returns the input unchanged when it cannot be parsed.
 */
export function formatTimeString(
  value: TimeString | null | undefined,
  pattern: string,
): string {
  const minutes = parseTimeString(value);

  if (minutes === undefined) {
    return value?.trim() ?? '';
  }

  const at = new Date(
    REFERENCE_YEAR,
    REFERENCE_MONTH,
    REFERENCE_DAY,
    0,
    minutes,
  );

  return format(at, pattern);
}
