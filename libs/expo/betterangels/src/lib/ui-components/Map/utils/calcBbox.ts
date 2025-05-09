import { Region } from 'react-native-maps';
import { TBbox } from '../types';

export function calcBbox(region: Region): TBbox {
  return [
    region.longitude - region.longitudeDelta,
    region.latitude - region.latitudeDelta,
    region.longitude + region.longitudeDelta,
    region.latitude + region.latitudeDelta,
  ];
}
