import { BaPermissionError } from '../../../errors/BaPermissionError';
import { OperationMessageKind } from '../__generated__/types';
import { DEFAULT_GENERIC_ERROR_MESSAGE } from '../constants';
import { getOperationInfo } from './getOperationInfo';
import { isUnauthenticatedError } from './isUnauthenticatedError';
import type { GraphQLResponse } from './types';
import { composeErrorMessage } from './utils/composeErrorMessage';

type ThrowOnMutationFailParams = {
  response: GraphQLResponse;
  operationKey: string;
  successTypename: string;
};

/**
 * Asserts that a mutation response succeeded, throwing on any failure.
 *
 * Use for non-form mutations (deletes, toggles, one-off actions) where there is
 * no form to display field-level errors on. Field-keyed form mutations should
 * use `getFieldErrorsOrThrow` instead.
 *
 * @param response - The full GraphQL response from a mutation.
 * @param operationKey - Key in `response.data` holding the mutation result
 *   (e.g. `"deleteClientDocument"`).
 * @param successTypename - Expected `__typename` on success (e.g.
 *   `"ClientDocumentType"`). Anything else is treated as an error payload.
 * @returns Nothing — throws on failure, completes silently on success.
 * @throws `BaPermissionError` for UNAUTHENTICATED / PERMISSION failures.
 * @throws `Error` for any other failure, with the server message composed.
 *
 * Error paths checked, in order:
 * 1. Top-level `response.errors` — UNAUTHENTICATED → `BaPermissionError`;
 *    everything else → `Error` with the composed message.
 * 2. `response.data[operationKey].__typename === successTypename` → success.
 * 3. OperationInfo payload — PERMISSION → `BaPermissionError`; anything else
 *    → `Error` with the composed message.
 * 4. Unclassifiable responses → generic `Error`.
 */
export function throwOnMutationFail(params: ThrowOnMutationFailParams): void {
  const { response, operationKey, successTypename } = params;

  // 1. Top-level errors (e.g. UNAUTHENTICATED, transport/server failures)
  if (response.errors?.length) {
    if (isUnauthenticatedError(response.errors)) {
      throw new BaPermissionError(
        response.errors.find((e) => e.message)?.message || undefined,
      );
    }

    throw new Error(composeErrorMessage(response.errors.map((e) => e.message)));
  }

  // 2. Success
  const result = response.data?.[operationKey];

  if (
    result &&
    typeof result === 'object' &&
    (result as { __typename?: string }).__typename === successTypename
  ) {
    return;
  }

  // 3. OperationInfo error payload
  const operationInfo = getOperationInfo(response, operationKey);

  if (operationInfo) {
    // PERMISSION → typed error so callers can special-case auth failures
    const permissionMsg = operationInfo.messages.find(
      (m) => m.kind === OperationMessageKind.Permission,
    );

    if (permissionMsg) {
      throw new BaPermissionError(permissionMsg.message || undefined);
    }

    // Compose ALL messages — no field filtering (non-form)
    throw new Error(
      composeErrorMessage(operationInfo.messages.map((m) => m.message)),
    );
  }

  // 4. Nothing we could classify
  throw new Error(DEFAULT_GENERIC_ERROR_MESSAGE);
}
