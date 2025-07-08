import { createContext } from 'react';

export type TBlockingScreenContext = {
  blockScreen: () => void;
  unblockScreen: () => void;
};

export const BlockingScreenContext = createContext<
  TBlockingScreenContext | undefined
>(undefined);
