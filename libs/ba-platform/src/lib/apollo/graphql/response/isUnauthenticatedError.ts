import { BE_PROTOCOL_ERROR_CODE } from '../backendApiCodes';
import type { GraphQLError } from './types';

/**
 * Checks whether any error in the list has an UNAUTHENTICATED code,
 * indicating the user is not logged in.
 *
 * @param errors - The `errors` array from a GraphQL response.
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
