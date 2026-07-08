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
 * - `field` appears in `allowedFields`.
 *
 * Everything else — other kinds, missing field, or field outside the filter —
 * is **unrecoverable** and must be handled by the caller (e.g. thrown).
 */
export function filterRecoverableOperationMessages(
  messages: OperationMessage[],
  allowedFields: string[]
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
    if (!m.field || !allowedFields.includes(m.field)) {
      unrecoverable.push(m);

      continue;
    }

    recoverable.push({ field: m.field, message: m.message });
  }

  return { recoverable, unrecoverable };
}
