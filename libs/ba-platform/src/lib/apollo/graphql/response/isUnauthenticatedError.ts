import { BE_PROTOCOL_ERROR_CODE } from '../backendApiCodes';
import type { GraphQLError } from './types';

/**
 * Checks whether a GraphQL response contains an unauthenticated error
 * (extensions.code === "UNAUTHENTICATED"), indicating the user is not logged in.
 */
export function isUnauthenticatedError(
  errors?: readonly GraphQLError[]
): boolean {
  return (
    errors?.some(
      (e) => e.extensions?.code === BE_PROTOCOL_ERROR_CODE.UNAUTHENTICATED
    ) ?? false
  );
}
