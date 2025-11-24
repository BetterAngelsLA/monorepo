import { TFormValidationError } from '../../../errors';
import { extractResponseExtensions } from './extractResponseExtensions';
import { TResultMinimal, TResultWithError } from './types';

const FIELD_ERROR_CODES = ['422'];

/**
 * Extract field-level validation errors from GraphQL extensions.
 *
 * @param response - Raw GraphQL/Apollo type response object.
 * @param fieldNames - If provided, only errors whose `field` matches one of these strings will be returned.
 */
export function extractExtensionFieldErrors(
  response?: TResultWithError | TResultMinimal | null,
  fieldNames?: readonly string[]
): TFormValidationError[] {
  if (!response) {
    return [];
  }

  const allResponseExtensions = extractResponseExtensions(response);

  if (!allResponseExtensions?.length) {
    return [];
  }

  const fieldNameSet = fieldNames ? new Set(fieldNames) : null;

  const fieldErrors: TFormValidationError[] = [];

  for (const err of allResponseExtensions) {
    if (!FIELD_ERROR_CODES.includes(err.errorCode)) {
      continue;
    }

    if (!err.field) {
      continue;
    }

    // include only names in fieldNames
    if (fieldNameSet && !fieldNameSet.has(err.field)) {
      continue;
    }

    fieldErrors.push(err);
  }

  return fieldErrors;
}
