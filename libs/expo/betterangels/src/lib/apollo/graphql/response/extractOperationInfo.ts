import { OperationInfo } from '../__generated__/types';

export function extractOperationInfo(
  responseOrData: unknown,
  queryKey: string
): OperationInfo | null {
  if (!responseOrData || typeof responseOrData !== 'object') {
    return null;
  }

  const maybeWithData = responseOrData as { data?: Record<string, unknown> };
  const dataObject =
    maybeWithData.data && typeof maybeWithData.data === 'object'
      ? maybeWithData.data
      : (responseOrData as Record<string, unknown>);

  const result = dataObject?.[queryKey] as { __typename?: string };

  if (result?.__typename !== 'OperationInfo') {
    return null;
  }

  return result as OperationInfo;
}
