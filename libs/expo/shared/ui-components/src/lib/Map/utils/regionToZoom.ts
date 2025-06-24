import { Region } from 'react-native-maps';

export function regionToApproxZoom(region: Region) {
  return Math.round(Math.log2(360 / region.longitudeDelta));
}

export function regionToZoom(region: Region, mapWidthPx: number): number {
  const WORLD_PX = 256; // Web-Mercator tile edge at zoom 0 (constant)

  return Math.log2((360 * mapWidthPx) / (region.longitudeDelta * WORLD_PX));
}
