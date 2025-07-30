import { atom } from 'jotai';
import { ReactNode } from 'react';

export type TDrawerPlacement = 'left' | 'right';

export type TAppDrawerAtomProps = {
  content: ReactNode | null;
  contentClassName?: string | null;
  header?: ReactNode | null;
  footer?: ReactNode | null;
  placement?: TDrawerPlacement;
  onClose?: () => void;
};

const defaultDraerProps: Partial<TAppDrawerAtomProps> = {
  placement: 'right',
};

const appDrawerAtomBase = atom<TAppDrawerAtomProps | null>(null);

export const appDrawerAtom = atom(
  (get) => {
    const drawer = get(appDrawerAtomBase);

    if (!drawer) return null;

    return {
      ...defaultDraerProps,
      ...drawer,
    };
  },
  (_get, set, update: TAppDrawerAtomProps | null) => {
    set(appDrawerAtomBase, update);
  }
);
