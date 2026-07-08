import { BaPermissionError } from '../../../errors/BaPermissionError';
import { OperationMessageKind } from '../__generated__/types';
import {
  DEFAULT_API_ERROR_MESSAGE,
  DEFAULT_FIELD_ERROR_MESSAGE,
  DEFAULT_GENERIC_ERROR_MESSAGE,
} from '../constants';
import { BaApiErrorCode } from '../types';
import { getOperationInfo } from './getOperationInfo';
import { isUnauthenticatedError } from './isUnauthenticatedError';
import type { FieldError, GraphQLResponse } from './types';
import { composeErrorMessage } from './utils/composeErrorMessage';
import { filterExtensionErrors } from './utils/filterExtensionErrors';
import { filterRecoverableOperationMessages } from './utils/filterRecoverableOperationMessages';
import { getExtensionErrors } from './utils/getExtensionErrors';

type GetFieldErrorsOrThrowParams = {
  response: GraphQLResponse;
  operationKey: string;
  successTypename: string;
  fields: string[];
};

/**
 * Extracts field-level validation errors from a GraphQL mutation response,
 * returning them for form display, or throws for non-recoverable errors.
 *
 * @param response - The full GraphQL response from a mutation.
 * @param operationKey - Key in `response.data` holding the mutation result
 *   (e.g. `"createClientProfile"`).
 * @param successTypename - Expected `__typename` on success (e.g.
 *   `"ClientProfileType"`). Anything else is treated as an error payload.
 * @param fields - Form field names to filter errors by. Must be non-empty.
 * @returns `FieldError[]` for recoverable field-level errors; `[]` on success.
 * @throws `BaPermissionError` for auth/permission failures.
 * @throws `Error` for unrecoverable or unexpected errors.
 *
 * Error paths checked, in order:
 * 1. Extension errors (`response.errors[0].extensions.errors`) — if all
 *    match the `fields` filter, returns `FieldError[]` with messages from
 *    `DEFAULT_API_ERROR_MESSAGE`. Otherwise throws.
 * 2. Top-level `response.errors` — UNAUTHENTICATED → `BaPermissionError`;
 *    everything else → generic `Error`.
 * 3. OperationInfo payload — VALIDATION messages matching `fields` →
 *    `FieldError[]`; PERMISSION → `BaPermissionError`; anything else → `Error`.
 */
export function getFieldErrorsOrThrow(
  params: GetFieldErrorsOrThrowParams
): FieldError[] {
  const { response, operationKey, successTypename, fields } = params;

  if (!fields.length) {
    console.error(
      '[getFieldErrorsOrThrow] requires a non-empty fields argument.'
    );

    throw new Error(DEFAULT_GENERIC_ERROR_MESSAGE);
  }

  // Extension errors
  const extensionErrors = getExtensionErrors(response);

  if (extensionErrors.length) {
    const matchedExtensionErrors = filterExtensionErrors({
      errors: extensionErrors,
      key: 'field',
      filters: fields,
    });

    // Some extension errors didn't match (no field, or field not in filter)
    if (matchedExtensionErrors.length !== extensionErrors.length) {
      throw new Error(DEFAULT_GENERIC_ERROR_MESSAGE);
    }

    const extensionFieldErrors: FieldError[] = matchedExtensionErrors.flatMap(
      (e) => {
        if (!e.field) {
          return [];
        }

        return [
          {
            field: e.field,
            message:
              DEFAULT_API_ERROR_MESSAGE[e.errorCode as BaApiErrorCode] ??
              e.message ??
              DEFAULT_FIELD_ERROR_MESSAGE,
          },
        ];
      }
    );

    // Extensions with field-level errors are recoverable — return for form display
    if (extensionFieldErrors.length) {
      return extensionFieldErrors;
    }
  }

  // Top-level errors (non-extension)
  if (response.errors?.length) {
    if (isUnauthenticatedError(response.errors)) {
      throw new BaPermissionError(
        response.errors.find((e) => e.message)?.message || undefined
      );
    }

    const errorMessages = response.errors?.map((e) => e.message) ?? [];
    const composedErrorMessage = composeErrorMessage(errorMessages);

    throw new Error(composedErrorMessage);
  }

  // No data
  const result = response.data?.[operationKey];

  if (!result || typeof result !== 'object') {
    throw new Error('No response data');
  }

  const typedResult = result as { __typename?: string };

  // Success
  if (typedResult.__typename === successTypename) {
    return [];
  }

  // OperationInfo
  const operationInfo = getOperationInfo(response, operationKey);

  // PERMISSION → throw
  const permissionMsg = operationInfo?.messages.find(
    (m) => m.kind === OperationMessageKind.Permission
  );

  if (permissionMsg) {
    throw new BaPermissionError(
      permissionMsg.field
        ? `You do not have permission to update the "${permissionMsg.field}" field`
        : permissionMsg.message || undefined
    );
  }

  // Partition messages
  const { recoverable, unrecoverable } = filterRecoverableOperationMessages(
    operationInfo?.messages ?? [],
    fields
  );

  // unrecoverable: we can't handle them, must throw.
  if (unrecoverable.length) {
    throw new Error(DEFAULT_GENERIC_ERROR_MESSAGE);
  }

  // recoverable: return for form display
  if (recoverable.length) {
    return recoverable;
  }

  // Unexpected error
  // It's not Success, but operationMessages was empty
  throw new Error(DEFAULT_GENERIC_ERROR_MESSAGE);
}
