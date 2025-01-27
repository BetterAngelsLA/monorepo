import { atom } from 'jotai';
import { ReactNode } from 'react';
import { ModalAnimationEnum, TModalType } from '../modal/modal';

type TProps = {
  content: ReactNode | null;
  type?: TModalType;
  animation?: ModalAnimationEnum | null;
  fullW?: boolean;
  footer?: ReactNode;
  closeOnMaskClick?: boolean;
  parentCss?: string;
  closeCss?: string;
  onClose?: () => void;
};

export const modalAtom = atom<TProps | null>(null);
