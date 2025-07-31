import { ReactNode } from 'react';

export type TDrawerPlacement = 'left' | 'right';

export type TAppDrawerProps = {
  visible: boolean;
  content: ReactNode | null;
  placement?: TDrawerPlacement;
  contentClassName?: string | null;
  header?: ReactNode | null;
  footer?: ReactNode | null;
};
