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

type TGorhomStatusRef = { current: number };

/**
 * Current status for a handle, or `undefined` when the instance doesn't expose
 * one (e.g. test doubles) — `canDismiss` treats that as dismissable.
 */
export function getGorhomStatus(
  instance: BottomSheetModal,
): number | undefined {
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
