import { OperationMessageKind } from '../__generated__/types';
import { getOperationInfoMessage } from './getOperationInfoMessage';
import type { GraphQLResponse } from './types';

/**
 * Returns the first PERMISSION message of an `OperationInfo` payload.
 *
 * Mutations that fail authorization resolve with an `OperationInfo` payload
 * instead of rejecting, so a resolved response is not proof of success. This
 * turns that "soft" permission failure into something a caller can surface
 * (typically `new BaPermissionError(message)`).
 *
 * @param response - The full GraphQL response from a mutation.
 * @param operationName - Key in `response.data` holding the mutation result.
 * @returns The permission message, or `null` when the payload is a success
 *   result or carries no permission message.
 */
export function getPermissionErrorMessage(
  response: GraphQLResponse,
  operationName: string,
): string | null {
  const permissionMessage = getOperationInfoMessage(
    response,
    operationName,
    OperationMessageKind.Permission,
  );

  return permissionMessage?.message || null;
}
