import type {
  OperationMessage,
  OperationMessageKind,
} from '../__generated__/types';
import { getOperationInfo } from './getOperationInfo';
import type { GraphQLResponse } from './types';

/**
 * Returns the first OperationInfo message, optionally filtered by kind.
 *
 * Reusable for the common "did this mutation return a PERMISSION (or another
 * kind) message?" check, without re-implementing the OperationInfo unwrap at
 * every call site.
 *
 * @param response - The full GraphQL response from a mutation.
 * @param operationName - Key in `response.data` holding the mutation result.
 * @param kind - When provided, only messages of this kind are considered.
 * @returns The first matching `OperationMessage`, or `null` when there is no
 *   OperationInfo payload / no matching message.
 */
export function getOperationInfoMessage(
  response: GraphQLResponse,
  operationName: string,
  kind?: OperationMessageKind,
): OperationMessage | null {
  const operationInfo = getOperationInfo(response, operationName);

  if (!operationInfo) {
    return null;
  }

  return (
    operationInfo.messages.find((m) => kind === undefined || m.kind === kind) ??
    null
  );
}
