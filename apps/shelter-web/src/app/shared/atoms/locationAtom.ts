import { TLatLng } from '@monorepo/react/components';
import { atom } from 'jotai';

export type TLocationSource = 'currentLocation' | 'address';

export interface TLocation extends TLatLng {
  source: TLocationSource;
}

export const locationAtom = atom<TLocation | null | undefined>(undefined);
