import { createContext } from 'react';
import { IModalScreenContext } from './types';

export const ModalScreenContext = createContext<
  IModalScreenContext | undefined
>(undefined);
