import { OperationInfo, OperationMessageKind } from '../../__generated__/types';
import type { FieldError } from '../types';

/**
 * Extract field-level VALIDATION messages from an OperationInfo.
 *
 * Returns only messages where `kind === VALIDATION` and `field` is non-null.
 * If `fields` is provided, only messages whose field matches one of the
 * given field names are returned.
 */
export function getOperationFieldErrors(
  opInfo: OperationInfo | null,
  fields?: string[]
): FieldError[] {
  if (!opInfo) return [];

  const fieldSet = fields ? new Set(fields) : null;

  return opInfo.messages
    .filter(
      (m) =>
        m.kind === OperationMessageKind.Validation &&
        m.field &&
        (!fieldSet || fieldSet.has(m.field))
    )
    .map((m) => ({ field: m.field!, message: m.message }));
}
