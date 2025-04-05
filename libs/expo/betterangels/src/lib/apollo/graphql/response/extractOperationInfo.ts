import { OperationInfo } from '../__generated__/types';

// Using a fixed list since generics become complicated with gql types
// And we may get away from using OperationInfo and just use errors
type TQueryKey = 'updateHmisProfile' | 'createHmisProfile';

export function extractOperationInfo<T extends Record<string, any>>(
  data: T,
  queryKey: TQueryKey
): OperationInfo | null {
  const resultData = data?.[queryKey];

  if (!resultData) {
    return null;
  }

  if (resultData['__typename'] === 'OperationInfo') {
    return resultData;
  }

  return null;
}
