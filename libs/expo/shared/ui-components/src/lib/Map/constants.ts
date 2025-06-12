import { Region } from 'react-native-maps';
import { RegionDeltaSize, TMapDeltaLatLng, TMapLatLng } from './types';

// geocode for approx center of LA COUNTY
export const LA_COUNTY_CENTER_LAT = 34.04499;
export const LA_COUNTY_CENTER_LNG = -118.251601;

// for more precision can calculate deltas onLayout, but this should be ok for now.
export const regionDeltaMap: Record<RegionDeltaSize, TMapDeltaLatLng> = {
  XS: {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  S: {
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  },
  M: {
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  },
  L: {
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  },
  XL: {
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  '2XL': {
    latitudeDelta: 0.075,
    longitudeDelta: 0.075,
  },
  '3XL': {
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  '4XL': {
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  },
} as const;

export const defaultRegionDelta = regionDeltaMap.M;

export const defaultAnimationDuration = 300;

export const LA_COUNTY_CENTER: TMapLatLng = {
  lat: LA_COUNTY_CENTER_LAT,
  lng: LA_COUNTY_CENTER_LNG,
};

export const defaultMapRegion: Region = {
  latitude: LA_COUNTY_CENTER.lat,
  longitude: LA_COUNTY_CENTER.lng,
  ...defaultRegionDelta,
};
