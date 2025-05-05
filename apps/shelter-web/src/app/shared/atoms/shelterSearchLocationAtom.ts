import { atom } from 'jotai';
import { LatLngLiteral } from '../components/map/types.maps';

export type TLocationSource = 'currentLocation' | 'address';

export interface TLocation extends LatLngLiteral {
  source: TLocationSource;
}

export const shelterSearchLocation = atom<TLocation | null>(null);
