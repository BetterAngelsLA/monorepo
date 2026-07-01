import type { OperationInfo } from '../__generated__/types';
import { OperationMessageKind } from '../__generated__/types';
import type { FieldError } from './types';

export type PartitionedMessages = {
  fieldErrors: FieldError[];
  otherMessage: string | null;
};

export function partitionMessages(
  opInfo: OperationInfo,
  fields?: string[]
): PartitionedMessages {
  const fieldErrors: FieldError[] = [];
  let otherMessage: string | null = null;
  const fieldSet = fields ? new Set(fields) : null;

  for (const msg of opInfo.messages ?? []) {
    if (msg.__typename !== 'OperationMessage') {
      continue;
    }

    if (
      msg.kind === OperationMessageKind.Validation &&
      msg.field &&
      (!fieldSet || fieldSet.has(msg.field))
    ) {
      fieldErrors.push({ field: msg.field, message: msg.message });
    } else if (!otherMessage) {
      otherMessage = msg.message;
    }
  }

  return { fieldErrors, otherMessage };
}
