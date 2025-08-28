import { atom } from 'jotai';
import { TAlertAtomProps } from '../types';

export const alertAtom = atom<TAlertAtomProps | null>(null);
