import type { OperationMessage } from '../__generated__/types';
import { OperationMessageKind } from '../__generated__/types';
import { getOperationInfo } from './getOperationInfo';

export function getOperationMessages(
  response: { data?: Record<string, unknown> | null },
  operationName: string,
  kind: OperationMessageKind
): OperationMessage[] | null {
  const opInfo = getOperationInfo(response, operationName);

  if (!opInfo) {
    return null;
  }

  const filtered = opInfo.messages.filter((m) => m.kind === kind);

  return filtered.length ? filtered : null;
}
