import { VALIDATION_ERROR_MESSAGES } from '../../constants';
import type { FieldError } from '../types';

/**
 * Extract field-level validation errors from a GraphQLError extensions payload.
 *
 * Handles the `clients/schema.py` → `validate_client_profile_data` → `GraphQLError`
 * error path, which embeds `{field, location, errorCode}` objects in
 * `response.errors[0].extensions.errors`.
 */
export function getExtensionValidationErrors(
  response: {
    errors?: readonly { extensions?: Record<string, unknown> }[];
  },
  fields?: string[]
): FieldError[] {
  const extensionsErrors = response.errors?.[0]?.extensions?.errors;
  if (!Array.isArray(extensionsErrors)) return [];

  const fieldSet = fields?.length ? new Set(fields) : null;

  return extensionsErrors
    .filter(
      (e: { field?: string }) =>
        !!e.field && (!fieldSet || fieldSet.has(e.field))
    )
    .map((e: { field: string; errorCode?: string; message?: string }) => ({
      field: e.field,
      message:
        VALIDATION_ERROR_MESSAGES[e.errorCode ?? ''] ??
        e.message ??
        'Invalid value',
    }));
}
