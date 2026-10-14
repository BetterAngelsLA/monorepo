import type RNMapView from 'react-native-maps';

// Type-only: a value re-export here is not erased by Babel, so it would pull
// `react-native-maps` into bundles that only need the type.
export type TMapView = RNMapView;

/**
 * Browser Maps JavaScript API key, installed once by the app through
 * `configureWebMaps`. The native SDKs take theirs from the app config plugins.
 */
export type TWebMapsConfig = {
  apiKey: string;
};

export type TMapLatLng = {
  lat: number;
  lng: number;
};

export type TMapDeltaLatLng = {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type RegionDeltaSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
