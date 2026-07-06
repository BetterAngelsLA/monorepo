import { API_ERROR_CODES } from '../constants';

/**
 * Checks whether a GraphQL response contains an unauthenticated error
 * (extensions.code === "UNAUTHENTICATED"), indicating the user is not logged in.
 */
export function isUnauthenticatedError(
  errors?: readonly { extensions?: Record<string, unknown> }[]
): boolean {
  return (
    errors?.some(
      (e) => e.extensions?.code === API_ERROR_CODES.UNAUTHENTICATED
    ) ?? false
  );
}
