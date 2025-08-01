import { ReactNode, useCallback, useState } from 'react';
import { Drawer } from '../Drawer';
import { DrawerContext } from './DrawerContext';

export type TDrawerPlacement = 'left' | 'right';

export type TDrawerProps = {
  visible: boolean;
  content: ReactNode | null;
  placement?: TDrawerPlacement;
  contentClassName?: string | null;
  header?: ReactNode | null;
  footer?: ReactNode | null;
};

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<TDrawerProps | null>(null);

  const showDrawer = useCallback((props: Omit<TDrawerProps, 'visible'>) => {
    setDrawer({ ...props, visible: true });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  return (
    <DrawerContext.Provider value={{ drawer, showDrawer, closeDrawer }}>
      {children}

      <Drawer />
    </DrawerContext.Provider>
  );
}
