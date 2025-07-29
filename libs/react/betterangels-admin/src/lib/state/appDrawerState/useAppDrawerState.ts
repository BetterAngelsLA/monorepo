import { useAtom } from 'jotai';
import { appDrawerAtom } from './appDrawerAtom';

export const useAppDrawerState = () => useAtom(appDrawerAtom);
