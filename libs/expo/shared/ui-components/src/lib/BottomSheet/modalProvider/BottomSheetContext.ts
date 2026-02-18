import { createContext } from 'react';
import { BottomSheetContextValue } from '../types';

export const BottomSheetContext = createContext<BottomSheetContextValue | null>(
  null
);
