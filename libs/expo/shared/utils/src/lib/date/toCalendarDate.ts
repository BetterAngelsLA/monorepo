import { isValid, parse } from 'date-fns';
import { toDateIsoSafe } from './toDateIsoSafe';

/**
 * Converts a string or Date-like value into a local calendar Date,
 * preserving the same year, month, and day, without shifting time zones.
 */
export function toCalendarDate(
  value?: string | Date | null,
  inputFormat?: string
): Date | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (value instanceof Date) {
    return isValid(value)
      ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
      : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  // Try ISO first
  const isoDate = toDateIsoSafe(trimmed);

  if (isoDate) {
    return new Date(
      isoDate.getFullYear(),
      isoDate.getMonth(),
      isoDate.getDate()
    );
  }

  // Try custom format
  if (inputFormat) {
    const parsed = parse(trimmed, inputFormat, new Date());

    if (isValid(parsed)) {
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }
  }

  return undefined;
}
