/**
 * Extracts an `OperationInfo` payload from a raw mutation response.
 *
 * Apollo returns `OperationInfo` as successful **data** (not a thrown
 * error), so callers that only wrap mutations in try/catch will silently
 * swallow backend validation messages.  Use this helper to surface those
 * messages.
 *
 * @param responseOrData  The raw response from `await mutate(...)`, or the
 *                        `data` property of that response.
 * @param queryKey        The top-level mutation field name (e.g. `'cloneBed'`).
 * @returns The `OperationInfo` payload, or `null` if none was found.
 */
export function extractOperationInfo(
  responseOrData: unknown,
  queryKey: string
): {
  __typename: 'OperationInfo';
  messages: Array<{ kind: string; field?: string | null; message: string }>;
} | null {
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

  return result as ReturnType<typeof extractOperationInfo>;
}
