import { atom } from 'jotai';
import { ReactNode } from 'react';

type TappDrawerAtomProps = {
  content: ReactNode | null;
  placement?: 'left' | 'right';
  animationTiming?: number;
  onClose?: () => void;
};

const defaultProps: Partial<TappDrawerAtomProps> = {
  placement: 'right',
  animationTiming: 300,
};

const appDrawerAtomBase = atom<TappDrawerAtomProps | null>(null);

export const appDrawerAtom = atom(
  (get) => {
    const drawer = get(appDrawerAtomBase);

    if (!drawer) return null;

    return {
      ...defaultProps,
      ...drawer,
    };
  },
  (_get, set, update: TappDrawerAtomProps | null) => {
    set(appDrawerAtomBase, update);
  }
);
