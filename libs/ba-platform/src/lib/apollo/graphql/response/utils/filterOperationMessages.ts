import {
  OperationInfo,
  OperationMessage,
  OperationMessageKind,
} from '../../__generated__/types';

/**
 * Filter OperationInfo messages by kind, optionally by field.
 *
 * If `fields` is provided, only messages whose field matches one of the
 * given names are returned. When omitted, all messages of the given kind
 * are returned (with or without field).
 */
export function filterOperationMessages(
  opInfo: OperationInfo | null,
  kind: OperationMessageKind,
  fields?: string[]
): OperationMessage[] {
  if (!opInfo) {
    return [];
  }

  const messagesByKind = opInfo.messages.filter((m) => m.kind === kind);

  if (!fields?.length) {
    return messagesByKind;
  }

  return messagesByKind.filter((m) => m.field && fields.includes(m.field));
}
