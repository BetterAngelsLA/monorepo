import type { OperationInfo } from '../__generated__/types';
import type { GraphQLResponse } from './types';

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
