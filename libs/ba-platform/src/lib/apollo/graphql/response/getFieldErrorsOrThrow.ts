import { BaPermissionError } from '../../../errors/BaPermissionError';
import { getOperationInfo } from './getOperationInfo';
import { isUnauthenticatedError } from './isUnauthenticatedError';
import type { FieldError } from './types';
import { composeErrorMessage } from './utils/composeErrorMessage';
import { getExtensionValidationErrors } from './utils/getExtensionValidationErrors';
import { getOperationOtherMessage } from './utils/getOperationOtherMessage';
import { getOperationValidationErrors } from './utils/getOperationValidationErrors';
import { hasPermissionMessage } from './utils/hasPermissionMessage';

type GetFieldErrorsOrThrowParams = {
  response: {
    data?: Record<string, unknown> | null;
    errors?: readonly {
      message?: string;
      extensions?: Record<string, unknown>;
    }[];
  };
  operationKey: string;
  successTypename: string;
  fields?: string[];
};

/**
 * Unified error handler for GraphQL mutation responses.
 *
 * Parses the response and either returns field-level validation errors
 * (for inline form display) or throws an appropriate error. Handles two
 * error sources from the backend:
 *
 * - **OperationInfo** (`data.<operationKey>.__typename === 'OperationInfo'`)
 *   Messages by kind:
 *     PERMISSION  → throws `BaPermissionError`
 *     VALIDATION with field → returned as `FieldError[]`
 *     ERROR, INFO, WARNING, VALIDATION without field → throws `Error`
 *
 * - **Top-level GraphQL errors** (`response.errors`)
 *     UNAUTHENTICATED  → throws `BaPermissionError`
 *     Has extensions.errors with fields → returned as `FieldError[]`
 *     NOT_FOUND, other → throws `Error`
 *
 * @returns FieldError[] — empty on success, populated on validation errors
 * @throws BaPermissionError — for unauthenticated or permission-denied.
 *   We throw `BaPermissionError` to indicate that we trust its message
 *   is safe to display to users.
 * @throws Error — for all other non-recoverable errors.
 *   We throw a generic `Error` because we cannot trust
 *   the message is safe for user display.
 */
export function getFieldErrorsOrThrow(
  params: GetFieldErrorsOrThrowParams
): FieldError[] {
  const { response, operationKey, successTypename, fields } = params;

  // ── Top-level response errors ─────────────────────────────────────────
  if (response.errors?.length) {
    const extensionFieldErrors = getExtensionValidationErrors(response, fields);

    // Extensions with field-level errors are recoverable — return for form display
    if (extensionFieldErrors.length) {
      return extensionFieldErrors;
    }

    // If fields filter excluded all extension errors, use generic fallback
    if (fields?.length && response.errors[0]?.extensions?.errors) {
      throw new Error('An unexpected error occurred.');
    }

    const errorMessages = response.errors?.map((e) => e.message) ?? [];
    const errMesssage = composeErrorMessage(errorMessages);

    if (isUnauthenticatedError(response.errors)) {
      throw new BaPermissionError(errMesssage);
    }

    throw new Error(errMesssage);
  }

  // ── No data ───────────────────────────────────────────────────────────
  const result = response.data?.[operationKey];

  if (!result || typeof result !== 'object') {
    throw new Error('No response data');
  }

  const typedResult = result as { __typename?: string };

  // ── Success ───────────────────────────────────────────────────────────
  if (typedResult.__typename === successTypename) {
    return [];
  }

  // ── OperationInfo ─────────────────────────────────────────────────────
  const opInfo = getOperationInfo(response, operationKey);

  // PERMISSION → throw
  if (hasPermissionMessage(opInfo)) {
    throw new BaPermissionError(
      getOperationOtherMessage(opInfo) || 'Permission denied.'
    );
  }

  // VALIDATION with field → return for form display
  const validationErrors: FieldError[] = [
    ...getOperationValidationErrors(opInfo, fields),
  ];

  if (validationErrors.length) {
    return validationErrors;
  }

  // Everything else → throw
  // If messages exist but no field errors matched (e.g. fields filter
  // excluded everything), use a generic fallback rather than leaking an
  // uncorrelated message from the server.
  if (fields?.length && opInfo?.messages?.length) {
    throw new Error('An unexpected error occurred.');
  }

  const otherMessage = getOperationOtherMessage(opInfo, fields);
  const errorMessages = response.errors?.map((e) => e.message) ?? [];
  const errMessage = composeErrorMessage([otherMessage, ...errorMessages]);

  throw new Error(errMessage);
}
