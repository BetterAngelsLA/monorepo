/**
 * useBottomSheetStack
 *
 * Internal hook that manages sheet stacking behavior.
 *
 * Applies `stackBehavior` when adding a new sheet:
 *
 * - 'push'    → append to stack
 * - 'switch'  → dismiss top sheet, add new one on top
 * - 'replace' → dismiss all existing sheets, add new one on top (default)
 *
 * 'switch'/'replace' dismiss the outgoing sheet(s) but KEEP them in the stack
 * until each one reports `onDismiss` (deferred removal). That lets the dismiss
 * animation finish and the lifecycle cleanup run — dropping them from state in
 * the same update (the old behavior) unmounted them mid-animation, skipped
 * `onDismiss`, and left the provider's bookkeeping stale, which corrupted the
 * next open/close cycle.
 *
 * This hook does not render anything — it only mutates the sheet list state.
 *
 * Upstream:
 * - Invoked by `BottomSheetModalProvider`
 * - Behavior configured via `BottomSheetOptions.stackBehavior`
 */

import { Dispatch, RefObject, SetStateAction, useCallback } from 'react';
import { StackBehavior } from '../../types';
import { TBottomSheetInstance } from './types.internal';

type TParams = {
  /**
   * Live mirror of the stack. Mutators keep it in sync synchronously so that
   * several `addSheet`/`removeSheet` calls within the same tick chain
   * correctly — a ref that only updated via the render effect would let a
   * second mutation in the same tick read stale state.
   */
  sheetsRef: RefObject<TBottomSheetInstance[]>;
  setSheets: Dispatch<SetStateAction<TBottomSheetInstance[]>>;
  /**
   * Requests dismissal of an existing sheet (marks it closing, dismisses the
   * gorhom instance, arms the safety valve). The sheet is left in the stack
   * until it reports `onDismiss`.
   */
  dismissSheet: (id: string) => void;
};

export function useBottomSheetStack(params: TParams) {
  const { sheetsRef, setSheets, dismissSheet } = params;

  const addSheet = useCallback(
    (instance: TBottomSheetInstance, stackBehavior: StackBehavior) => {
      const previousSheets = sheetsRef.current;

      // Push: add stack on top, leave everything else alone.
      if (stackBehavior === 'push') {
        const next = [...previousSheets, instance];

        sheetsRef.current = next;
        setSheets(next);

        return;
      }

      // Switch: dismiss only the top sheet.
      // Replace: dismiss all existing sheets (default).
      if (stackBehavior === 'switch' && previousSheets.length > 0) {
        dismissSheet(previousSheets[previousSheets.length - 1].id);
      } else if (stackBehavior === 'replace') {
        previousSheets.forEach((sheet) => dismissSheet(sheet.id));
      }

      // The outgoing sheet(s) stay in the stack (deferred removal): each one
      // is removed by the provider when it reports `onDismiss`.
      const next = [...previousSheets, instance];

      sheetsRef.current = next;
      setSheets(next);
    },
    [sheetsRef, setSheets, dismissSheet],
  );

  return {
    addSheet,
  };
}
