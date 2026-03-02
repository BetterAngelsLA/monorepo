/**
 * Hook for interacting with the BottomSheet modal system.
 *
 * Exposes methods such as `showBottomSheet` and `popTopSheet`.
 * Must be used within BottomSheetModalProvider.
 *
 * Example:
 *
 * const { showBottomSheet } = useBottomSheet();
 *
 * showBottomSheet(
 *   ({ closeSheet }) => (
 *     <MyForm onDone={closeSheet} />
 *   ),
 *   {
 *     snapPoints: ['50%'],
 *     scrollable: true,
 *   }
 * );
 */

import { useContext } from 'react';
import { BottomSheetContext } from './BottomSheetContext';

export function useBottomSheet() {
  const ctx = useContext(BottomSheetContext);

  if (!ctx) {
    throw new Error('useBottomSheet must be used within BottomSheetProvider');
  }

  return ctx;
}
