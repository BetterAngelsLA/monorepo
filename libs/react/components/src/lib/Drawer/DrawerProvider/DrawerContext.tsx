import { createContext } from 'react';
import { TDrawerProps } from './DrawerProvider';

type TDrawerContext = {
  drawer: TDrawerProps | null;
  showDrawer: (props: Omit<TDrawerProps, 'visible'>) => void;
  closeDrawer: () => void;
};

export const DrawerContext = createContext<TDrawerContext | undefined>(
  undefined
);
