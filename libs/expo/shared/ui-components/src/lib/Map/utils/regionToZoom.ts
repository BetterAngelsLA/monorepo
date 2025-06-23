import { Region } from 'react-native-maps';

export function regionToZoom(region: Region) {
  return Math.round(Math.log2(360 / region.longitudeDelta));
}
