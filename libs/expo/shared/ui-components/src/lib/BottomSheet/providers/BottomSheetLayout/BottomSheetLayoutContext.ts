import { createContext } from 'react';

type BottomSheetLayoutContextValue = {
  registerContainer: (id: string, height: number) => void;
  unregisterContainer: (id: string) => void;
};

export const BottomSheetLayoutContext =
  createContext<BottomSheetLayoutContextValue | null>(null);
