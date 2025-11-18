import { ApolloLink } from '@apollo/client';
import { OperationInfo } from '../__generated__/types';

export function extractOperationInfo<T>(
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
