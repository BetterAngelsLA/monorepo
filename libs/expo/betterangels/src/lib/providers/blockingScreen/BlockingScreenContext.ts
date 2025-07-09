import { createContext } from 'react';

export type TBlockingScreenContext = {
  blockScreen: () => void;
  unblockScreen: () => void;
  blockScreenUntilNextNavigation: () => void;
};

export const BlockingScreenContext = createContext<
  TBlockingScreenContext | undefined
>(undefined);
