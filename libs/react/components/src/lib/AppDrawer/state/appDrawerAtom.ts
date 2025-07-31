import { atom } from 'jotai';
import { ReactNode } from 'react';

export type TDrawerPlacement = 'left' | 'right';

export type TAppDrawerAtomProps = {
  visible: boolean;
  content: ReactNode | null;
  placement?: TDrawerPlacement;
  contentClassName?: string | null;
  header?: ReactNode | null;
  footer?: ReactNode | null;
};

export const appDrawerAtom = atom<TAppDrawerAtomProps | null>(null);
