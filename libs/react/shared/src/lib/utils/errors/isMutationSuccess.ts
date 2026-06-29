/**
 * Type guard that checks whether a GraphQL mutation response fragment
 * has the expected __typename, indicating a successful result.
 *
 * Returns `false` for null, undefined, or any result whose __typename
 * does not match `expectedTypename`.  This prevents silent-success when
 * a mutation returns a null response or a different union member
 * (e.g. `OperationInfo`).
 *
 * @example
 * ```ts
 * const { data: result } = await updateReservation({ ... });
 * if (result?.updateReservation?.__typename === 'OperationInfo') {
 *   // handle known error
 *   return;
 * }
 * if (!isMutationSuccess(result?.updateReservation, 'ReservationType')) {
 *   // handle unexpected null / missing __typename
 *   return;
 * }
 * onSuccess?.();
 * ```
 */
export function isMutationSuccess<T extends { __typename?: string }>(
  result: T | null | undefined,
  expectedTypename: string
): result is T {
  return result?.__typename === expectedTypename;
}
