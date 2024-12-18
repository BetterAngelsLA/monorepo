import { atom } from 'jotai';
import { ReactNode } from 'react';
import { ModalAnimationEnum, TModalType } from '../modal/modal';

type IModalContentAtom = {
  content: ReactNode | null;
  type?: TModalType;
  animation?: ModalAnimationEnum | null;
  closeOnMaskClick?: boolean;
};

export const modalContentAtom = atom<IModalContentAtom | null>(null);
