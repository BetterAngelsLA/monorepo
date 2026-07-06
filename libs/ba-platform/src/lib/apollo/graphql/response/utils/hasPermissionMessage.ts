import { OperationInfo, OperationMessageKind } from '../../__generated__/types';

/**
 * Check whether an OperationInfo contains any PERMISSION-kind messages.
 */
export function hasPermissionMessage(opInfo: OperationInfo | null): boolean {
  if (!opInfo) {
    return false;
  }

  return opInfo.messages.some(
    (m) => m.kind === OperationMessageKind.Permission
  );
}
