import { DEFAULT_GQL_ERROR_MESSAGE } from '../../constants';

/**
 * Joins non-empty messages with "; " separators into a single error string.
 * Falls back to `DEFAULT_GQL_ERROR_MESSAGE` when all messages are empty.
 *
 * @param messages - Messages from `response.errors` to join.
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

  return DEFAULT_GQL_ERROR_MESSAGE;
}
