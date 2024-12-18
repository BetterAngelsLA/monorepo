import { atom } from 'jotai';
import { ReactNode } from 'react';

export enum ModalAnimationEnum {
  SLIDE_UP = 'animate-slideInUp',
  SLIDE_IN_LEFT = 'animate-slideInLeft',
  EXPAND = 'animate-expandInOut',
}

type IModalContentAtom = {
  content: ReactNode | null;
  header?: string | ReactNode;
  fullScreen?: boolean;
  forceSmall?: boolean;
  animation?: ModalAnimationEnum | null;
};

export const modalContentAtom = atom<IModalContentAtom | null>(null);
