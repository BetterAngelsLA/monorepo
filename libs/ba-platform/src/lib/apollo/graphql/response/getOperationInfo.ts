import type { OperationInfo } from '../__generated__/types';
import type { GraphQLResponse } from './types';

/**
 * Extracts an `OperationInfo` payload from a mutation response.
 *
 * @param response - The full GraphQL response from a mutation.
 * @param operationName - Key in `response.data` holding the mutation result.
 * @returns The `OperationInfo` object if the result's `__typename` is
 *   `"OperationInfo"`, otherwise `null`.
 */
export function getOperationInfo(
  response: GraphQLResponse,
  operationName: string
): OperationInfo | null {
  const result = response.data?.[operationName];

  if (!result || typeof result !== 'object') {
    return null;
  }

  const typedResult = result as { __typename?: string };

  if (typedResult.__typename !== 'OperationInfo') {
    return null;
  }

  return result as OperationInfo;
}
