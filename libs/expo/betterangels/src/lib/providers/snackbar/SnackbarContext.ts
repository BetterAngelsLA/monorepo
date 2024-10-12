import { createContext } from 'react';
import type { TShowSnackbar } from './SnackbarProvider';

export type TSnackbarContext = {
  showSnackbar: (props: TShowSnackbar) => void;
};

export const SnackbarContext = createContext<TSnackbarContext | undefined>(
  undefined
);
