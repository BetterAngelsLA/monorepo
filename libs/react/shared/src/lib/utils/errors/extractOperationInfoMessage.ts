import { extractOperationInfo } from './extractOperationInfo';

/**
 * Extracts the first human-readable message from an `OperationInfo` payload.
 *
 * This is a convenience wrapper around {@link extractOperationInfo} for
 * consumers that only need a single error string (e.g. alert banners).
 *
 * @param responseOrData  The raw mutation response or its `data` property.
 * @param queryKey        The top-level mutation field name.
 * @returns The first message string, or `null` if no `OperationInfo` was found.
 */
export function extractOperationInfoMessage(
  responseOrData: unknown,
  queryKey: string
): string | null {
  const operationInfo = extractOperationInfo(responseOrData, queryKey);

  if (!operationInfo || operationInfo.messages.length === 0) {
    return null;
  }

  return operationInfo.messages[0].message || null;
}
