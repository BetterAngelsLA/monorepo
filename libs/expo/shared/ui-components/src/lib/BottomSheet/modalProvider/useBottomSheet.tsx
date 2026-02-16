import { useContext } from 'react';
import { BottomSheetContext } from './BottomSheetContext';

export function useBottomSheet() {
  const ctx = useContext(BottomSheetContext);

  if (!ctx) {
    throw new Error('useBottomSheet must be used within BottomSheetProvider');
  }

  return ctx;
}
