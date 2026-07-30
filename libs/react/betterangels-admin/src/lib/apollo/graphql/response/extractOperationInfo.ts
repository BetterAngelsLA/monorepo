import { ApolloLink } from '@apollo/client';
import { OperationInfo } from '@monorepo/ba-platform/types';

export function extractOperationInfo(
  response: ApolloLink.Result,
  queryKey: string
): OperationInfo | null {
  const resultData = response?.data?.[queryKey];

  if (!resultData) {
    return null;
  }

  if (resultData['__typename'] === 'OperationInfo') {
    return resultData;
  }

  return null;
}
