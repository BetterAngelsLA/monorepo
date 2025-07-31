import { WritableAtom, atom } from 'jotai';
import { ReactNode } from 'react';

export type TDrawerPlacement = 'left' | 'right';

export type TAppDrawerAtomProps = {
  visible: boolean;
  content: ReactNode | null;
  contentClassName?: string | null;
  header?: ReactNode | null;
  footer?: ReactNode | null;
  placement?: TDrawerPlacement;
};

const defaultDrawerProps: Partial<TAppDrawerAtomProps> = {
  placement: 'right',
  visible: false,
};

const appDrawerAtomBase = atom<TAppDrawerAtomProps | null>(null);

type drawerSetterFn = (
  prev: TAppDrawerAtomProps | null
) => TAppDrawerAtomProps | null;

export const appDrawerAtom: WritableAtom<
  TAppDrawerAtomProps | null, // Return read value
  [TAppDrawerAtomProps | null | drawerSetterFn], // Write argument (tuple)
  void // Return type of write function
> = atom(
  (get) => {
    const drawer = get(appDrawerAtomBase);

    if (!drawer) {
      return null;
    }

    return { ...defaultDrawerProps, ...drawer };
  },
  (get, set, update) => {
    const prev = get(appDrawerAtomBase);
    const next = typeof update === 'function' ? update(prev) : update;

    set(appDrawerAtomBase, next);
  }
);
