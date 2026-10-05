/**
 * useBottomSheetStack
 *
 * Internal hook that manages sheet stacking behavior.
 *
 * Applies `stackBehavior` when adding a new sheet:
 *
 * - 'push'    → append to stack
 * - 'switch'  → dismiss top sheet, replace it
 * - 'replace' → dismiss all sheets, keep only new one
 *
 * Dismissals are delegated to the provider's idempotent `dismissSheet`.
 *
 * This hook does not render anything — it only mutates
 * the sheet list state.
 *
 * Upstream:
 * - Invoked by `BottomSheetModalProvider`
 * - Behavior configured via `BottomSheetOptions.stackBehavior`
 */

import { Dispatch, useCallback } from 'react';
import { StackBehavior } from '../../types';
import { TBottomSheetInstance } from './types.internal';

type TParams = {
  /**
   * Idempotent, imperative dismissal of a sheet by id.
   * Supplied by the provider so this hook never touches Gorhom refs directly.
   */
  dismissSheet: (id: string) => void;
  setSheets: Dispatch<React.SetStateAction<TBottomSheetInstance[]>>;
};

export function useBottomSheetStack(params: TParams) {
  const { dismissSheet, setSheets } = params;

  const addSheet = useCallback(
    (instance: TBottomSheetInstance, stackBehavior: StackBehavior) => {
      setSheets((previousSheets) => {
        // Push: add stack on top
        if (stackBehavior === 'push') {
          return [...previousSheets, instance];
        }

        // Switch: replace the top sheet only
        if (stackBehavior === 'switch') {
          if (previousSheets.length > 0) {
            const top = previousSheets[previousSheets.length - 1];

            dismissSheet(top.id);
          }

          return [...previousSheets.slice(0, -1), instance];
        }

        // Replace: dismiss all existing sheets (default)
        previousSheets.forEach((sheet) => dismissSheet(sheet.id));

        return [instance];
      });
    },
    [setSheets, dismissSheet],
  );

  return {
    addSheet,
  };
}
