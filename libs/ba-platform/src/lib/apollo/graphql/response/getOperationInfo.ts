import type { OperationInfo } from '../__generated__/types';

export function getOperationInfo(
  response: { data?: Record<string, unknown> | null },
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
