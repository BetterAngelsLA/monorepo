import { isValid, parseISO } from 'date-fns';
import { isIsoDateString } from './isIsoDateString';

/**
 * Parses an ISO-like date string safely.
 * Returns undefined if the input is not valid or not an ISO date.
 */
export function toDateIsoSafe(value?: string | null): Date | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!isIsoDateString(trimmed)) {
    return undefined;
  }

  const date = parseISO(trimmed);

  if (!isValid(date)) {
    return undefined;
  }

  return date;
}
