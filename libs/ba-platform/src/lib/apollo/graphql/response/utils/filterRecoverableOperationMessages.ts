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
 * Filter entry describing a field array of sub-models: `parentKey` is the array
 * field on the parent object (e.g. `additionalContacts`) and `children` are the
 * item field names (e.g. the keys of the contact schema). Matches messages
 * keyed at `<parentKey>.<index>.<child>`, e.g. `additionalContacts.0.contactEmail`.
 */
export type IndexedField = {
  parentKey: string;
  children: string[];
};

/**
 * Partitions {@link OperationMessage}s into recoverable field errors and
 * unrecoverable messages.
 *
 * A message is **recoverable** when:
 * - `kind` is {@link OperationMessageKind.Validation},
 * - `field` is non-null, and
 * - `field` matches an entry in `allowedFields`, where an entry is either:
 *   - a **plain name** — matches the field's first dotted segment
 *     (e.g. `additionalContacts.0.contactEmail` matches `additionalContacts`;
 *     a plain `name` also matches `name.first`), or
 *   - an {@link IndexedField} — matches exactly `<parentKey>.<index>.<child>`
 *     for one of its `children` (e.g. `{ parentKey: 'additionalContacts',
 *     children: ['contactEmail'] }` matches `additionalContacts.0.contactEmail`
 *     but not `additionalContacts.0.id` or `additionalContacts.0`).
 *
 * Everything else — other kinds, missing field, or field outside the filter —
 * is **unrecoverable** and must be handled by the caller (e.g. thrown).
 */
function matchesAllowedField(
  field: string,
  allowedFields: (string | IndexedField)[],
) {
  const segments = field.split('.');

  return allowedFields.some((allowed) => {
    if (typeof allowed === 'string') {
      return allowed === segments[0];
    }

    return (
      segments.length === 3 &&
      segments[0] === allowed.parentKey &&
      /^\d+$/.test(segments[1]) &&
      allowed.children.includes(segments[2])
    );
  });
}

export function filterRecoverableOperationMessages(
  messages: OperationMessage[],
  allowedFields: (string | IndexedField)[],
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
