import { format } from 'date-fns';
import type { TimeString } from '../branded';

const MINUTES_PER_DAY = 24 * 60;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Serialize minutes-since-midnight for the `Time` GraphQL scalar.
 *
 * Clamped to a single day, so `1500` becomes `"24:00:00"` rather than wrapping
 * into the next morning.
 */
export function toTimeString(minutesSinceMidnight: number): TimeString {
  const total = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minutesSinceMidnight)));

  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`;
}

/**
 * Parse a `Time` scalar into minutes since midnight.
 *
 * Accepts `HH:mm` and `HH:mm:ss`. Returns `undefined` for anything else, so a
 * malformed value can never silently become `NaN` minutes.
 */
export function fromTimeString(
  value?: TimeString | null,
): number | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const [hourRaw, minuteRaw = '0'] = trimmed.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return undefined;
  }

  return hour * 60 + minute;
}

/**
 * Format a `Time` scalar for display, e.g. `formatTimeString(curfew, 'h:mm a')`.
 * Returns the input unchanged when it cannot be parsed.
 */
export function formatTimeString(
  value: TimeString | null | undefined,
  pattern: string,
): string {
  const minutes = fromTimeString(value);

  if (minutes === undefined) {
    return value?.trim() ?? '';
  }

  const midnight = new Date();
  midnight.setHours(0, minutes, 0, 0);

  return format(midnight, pattern);
}
