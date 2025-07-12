import { atom } from 'jotai';
import { ReactNode } from 'react';

type TProps = {
    content?: ReactNode | null;
    fullW?: boolean;
    footer?: ReactNode;
    closeOnMaskClick?: boolean;
    parentCss?: string;
    closeCss?: string;
    onClose?: () => void;
}

export const flyoutAtom = atom<TProps | null>(null);
