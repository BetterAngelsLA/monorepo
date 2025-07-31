import { atom } from 'jotai';
import { TAppDrawerProps } from '../types';

export const appDrawerAtom = atom<TAppDrawerProps | null>(null);
