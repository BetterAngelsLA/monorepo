import { atom } from 'jotai';
import { TLatLng } from '../../../../../../apps/shelter-web/src/app/shared/components/map/types.maps';

export type TLocationSource = 'currentLocation' | 'address';

export interface TLocation extends TLatLng {
  source: TLocationSource;
}

export const locationAtom = atom<TLocation | null | undefined>(undefined);
