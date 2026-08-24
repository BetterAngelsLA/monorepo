import type { DateTimeString } from '../branded';
import { isoToDateSafe } from './isoToDateSafe';

/** Parse a `DateTime` scalar. `undefined` when unparseable, never an invalid `Date`. */
export function parseDateTimeString(
  value?: DateTimeString | null,
): Date | undefined {
  return isoToDateSafe(value);
}
