import { atom } from 'jotai';
import { TShelter } from '../components/shelter/shelterCard';

export const sheltersAtom = atom<TShelter[]>([]);
