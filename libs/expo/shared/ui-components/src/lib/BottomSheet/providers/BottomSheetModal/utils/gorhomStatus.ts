/**
 * Reading Gorhom's own modal status.
 *
 * Gorhom exposes its status ref on the imperative handle (`useImperativeHandle`
 * → `status: statusRef`) but does not declare it on the public type, so the cast
 * below is the only way in. This status decides whether it is safe to hand a
 * dismissal to Gorhom — see rule 2 in the provider header.
 */

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { GORHOM_DISMISSABLE_STATUSES } from '../constants';
import { TGorhomModalStatus } from '../types';

/**
 * The handle's ref holds a bare `number` (the enum Gorhom compares it against
 * is unexported), so naming it `TGorhomModalStatus` is an assertion, not a
 * guarantee — a status we mirrored wrongly still arrives as whatever Gorhom
 * really set. Nothing switches on it exhaustively, though: `canDismiss` only
 * asks whether it is in the dismissable list, so anything unexpected falls
 * through to "not dismissable", which is the safe answer.
 */
type TGorhomStatusRef = { current: TGorhomModalStatus };

/**
 * Current status for a handle, or `undefined` when the instance doesn't expose
 * one (e.g. test doubles) — `canDismiss` treats that as dismissable.
 */
export function getGorhomStatus(
  instance: BottomSheetModal,
): TGorhomModalStatus | undefined {
  return (instance as BottomSheetModal & { status?: TGorhomStatusRef }).status
    ?.current;
}

/**
 * True when Gorhom will accept and act on `dismiss()` right now (rule 2) — not
 * merely that the sheet may be dismissed by the user.
 */
export function canDismiss(instance: BottomSheetModal): boolean {
  const status = getGorhomStatus(instance);

  return status === undefined || GORHOM_DISMISSABLE_STATUSES.includes(status);
}
