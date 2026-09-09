import {
  OperationMessage,
  OperationMessageKind,
} from '../../__generated__/types';
import type { FieldError } from '../types';

type PartitionResult = {
  recoverable: FieldError[];
  unrecoverable: OperationMessage[];
};

/**
 * Partitions {@link OperationMessage}s into recoverable field errors and
 * unrecoverable messages.
 *
 * A message is **recoverable** when:
 * - `kind` is {@link OperationMessageKind.Validation},
 * - `field` is non-null, and
 * - `field`'s first dotted segment matches an entry in `allowedFields`
 *   (e.g. `additionalContacts.0.contactEmail` matches `additionalContacts`;
 *   a plain `name` matches `name`).
 *
 * Everything else — other kinds, missing field, or field outside the filter —
 * is **unrecoverable** and must be handled by the caller (e.g. thrown).
 */
function matchesAllowedField(field: string, allowedFields: string[]) {
  const firstSegment = field.split('.')[0];

  return allowedFields.includes(firstSegment);
}

export function filterRecoverableOperationMessages(
  messages: OperationMessage[],
  allowedFields: string[],
): PartitionResult {
  const recoverable: FieldError[] = [];
  const unrecoverable: OperationMessage[] = [];

  for (const m of messages) {
    // recoverable must be VALIDATION kind
    if (m.kind !== OperationMessageKind.Validation) {
      unrecoverable.push(m);

      continue;
    }

    // recoverable must have field in allowedFields
    if (!m.field || !matchesAllowedField(m.field, allowedFields)) {
      unrecoverable.push(m);

      continue;
    }

    recoverable.push({ field: m.field, message: m.message });
  }

  return { recoverable, unrecoverable };
}
