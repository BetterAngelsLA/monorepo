import { useContext } from 'react';
import { BottomSheetLayoutContext } from './BottomSheetLayoutContext';

export function useBottomSheetLayoutContext() {
  const ctx = useContext(BottomSheetLayoutContext);

  if (!ctx) {
    throw new Error(
      'useBottomSheetLayoutContext must be used inside BottomSheetLayoutProvider'
    );
  }

  return ctx;
}
