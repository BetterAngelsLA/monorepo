import { atom } from 'jotai';
import { ReactNode } from 'react';
import { ModalAnimationEnum, TModalType } from '../modal/modal';

type TProps = {
  content: ReactNode | null;
  type?: TModalType;
  animation?: ModalAnimationEnum | null;
  closeOnMaskClick?: boolean;
};

export const modalAtom = atom<TProps | null>(null);
