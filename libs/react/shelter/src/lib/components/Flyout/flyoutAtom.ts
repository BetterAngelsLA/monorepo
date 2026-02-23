import { atom } from 'jotai';
import { ReactNode } from 'react';
import { FlyoutAnimationEnum } from './enums';

type TProps = {
  content?: ReactNode | null;
  fullW?: boolean;
  footer?: ReactNode;
  closeOnClick?: boolean;
  parentCss?: string;
  closeCss?: string;
  animation?: FlyoutAnimationEnum | null;
  onClose?: () => void;
};

export const flyoutAtom = atom<TProps | null>(null);
