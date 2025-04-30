import { FetchResult } from '@apollo/client';
import { OperationInfo } from '../__generated__/types';

// Using a fixed list since generics become complicated with gql types
// And we may get away from using OperationInfo and just use errors
type TQueryKey =
  | 'updateHmisProfile'
  | 'createHmisProfile'
  | 'updateClientContact'
  | 'createClientContact';

export function extractOperationInfo(
  response: FetchResult,
  queryKey: TQueryKey
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
