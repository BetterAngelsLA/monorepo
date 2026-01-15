import { API_ERROR_CODES } from '../../../../common';

type TErrorExtensions = { code?: string };

/**
 * Check if the error is an HMIS token expired error
 */
export function isHmisTokenExpiredError(
  graphQLErrors?: readonly any[]
): boolean {
  return (
    graphQLErrors?.some(
      (e) =>
        (e.extensions as TErrorExtensions | undefined)?.code ===
        API_ERROR_CODES.HMIS_TOKEN_EXPIRED
    ) ?? false
  );
}
