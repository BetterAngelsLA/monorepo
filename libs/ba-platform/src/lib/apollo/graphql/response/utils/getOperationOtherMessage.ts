import { OperationInfo, OperationMessageKind } from '../../__generated__/types';

/**
 * Get the first non-field-error message from an OperationInfo.
 *
 * Returns the message of the first OperationMessage that is NOT a VALIDATION
 * with a non-null field. Returns null if all messages are per-field VALIDATION
 * or if opInfo is null.
 *
 * When `fields` is provided, VALIDATION messages matching those fields are also
 * excluded (treated as handled by the caller).
 */
export function getOperationOtherMessage(
  opInfo: OperationInfo | null,
  fields?: string[]
): string | null {
  if (!opInfo) {
    return null;
  }

  const fieldSet = fields ? new Set(fields) : null;

  for (const msg of opInfo.messages) {
    const isFieldValidation =
      msg.kind === OperationMessageKind.Validation &&
      msg.field &&
      (!fieldSet || fieldSet.has(msg.field));

    if (!isFieldValidation) {
      return msg.message;
    }
  }

  return null;
}
