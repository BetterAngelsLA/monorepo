import { isValid, parseISO } from 'date-fns';

/** `parseISO` accepts partial forms — "2026" becomes Jan 1, "2026-05" becomes May 1. */
const FULL_ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * Parse an ISO date or datetime string. Returns `undefined` rather than an
 * invalid `Date`, so a bad value cannot reach `format` and throw.
 *
 * Validity is `parseISO` + `isValid`; the only thing checked separately is that
 * a full calendar date is present, because a bare year silently becoming
 * January 1st is worse than a rejection.
 */
export function isoToDateSafe(value?: string | null): Date | undefined {
  const trimmed = value?.trim();

  if (!trimmed || !FULL_ISO_DATE.test(trimmed)) {
    return undefined;
  }

  const date = parseISO(trimmed);

  return isValid(date) ? date : undefined;
}
