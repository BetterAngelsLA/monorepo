import { atom } from 'jotai';
import { TShelter } from '../../../../../../apps/shelter-web/src/app/shared/components/shelter/shelterCard';

export const sheltersAtom = atom<TShelter[]>([]);
