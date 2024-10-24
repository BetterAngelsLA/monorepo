import { createContext } from 'react';

export type TKeyboardToolbarContext = {
  keyboardArrowsVisible: boolean;
  showKeyboardArrows: () => void;
  hideKeyboardArrows: () => void;
};

export const KeyboardToolbarContext = createContext<
  TKeyboardToolbarContext | undefined
>(undefined);
