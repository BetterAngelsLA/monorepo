/**
 * Compose a loggable error description from one or more message sources.
 *
 * Joins all non-empty messages with "; " separators. Useful for logging
 * the full error context when throwing a generic Error in getFieldErrorsOrThrow.
 */
export function composeErrorMessage(
  messages: (string | null | undefined)[]
): string {
  const filtered = messages
    .map((m) => m?.trim())
    .filter((m): m is string => !!m);

  if (filtered.length) {
    return filtered.join('; ');
  }

  return 'An unknown error occurred.';
}
