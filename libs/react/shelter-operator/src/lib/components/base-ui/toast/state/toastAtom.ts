import { atom } from 'jotai';
import { IToastAtomProps } from '../types';

export const toastAtom = atom<IToastAtomProps[]>([]);
