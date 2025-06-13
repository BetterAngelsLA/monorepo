import { Region } from 'react-native-maps';
import { TBbox } from '../types';

export function regionToBbox(region: Region): TBbox {
  return [
    region.longitude - region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
  ];
}
