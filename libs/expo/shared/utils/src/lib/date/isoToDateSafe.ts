import { isValid, parseISO } from 'date-fns';
import { isValidIsoDate } from './isValidIsoDate';

/**
 * Parses an ISO-like date string safely.
 * If valid input: returns Date
 * If not valid input: returns undefined
 */
export function isoToDateSafe(value?: string | null): Date | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!isValidIsoDate(trimmed)) {
    return undefined;
  }

  const date = parseISO(trimmed);

  if (!isValid(date)) {
    return undefined;
  }

  return date;
}
