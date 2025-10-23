/**
 * Checks if a given value is an ISO 8601–like date string.
 * Examples of valid ISO dates:
 *   - "2025-10-20"
 *   - "2025-10-20T00:00:00Z"
 *   - "2025-10-20T00:00:00.000Z"
 */
export function isIsoDateString(value?: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  // quick reject for non-date-like strings
  if (trimmedValue.length < 10) {
    return false;
  }

  // ISO date (YYYY-MM-DD) or datetime (YYYY-MM-DDTHH:mm:ss[.sss]Z)
  const isoPattern = /^\d{4}-\d{2}-\d{2}(?:[Tt][\d:.+-Z]*)?$/;

  if (!isoPattern.test(trimmedValue)) {
    return false;
  }

  return true;
}
