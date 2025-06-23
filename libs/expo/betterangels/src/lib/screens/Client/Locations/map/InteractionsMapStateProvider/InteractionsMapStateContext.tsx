import { createContext } from 'react';
import { TInteractionsMapStateContext } from './types';

export const InteractionsMapStateContext = createContext<
  TInteractionsMapStateContext | undefined
>(undefined);
