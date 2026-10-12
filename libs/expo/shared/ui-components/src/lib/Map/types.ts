import type RNMapView from 'react-native-maps';

/**
 * Type-only on purpose: re-exporting the class as a value (`export { RNMapView
 * as TMapView }`) is not erased by Babel, so it pulls `react-native-maps` into
 * bundles that only wanted the type — defeating the platform substitution's
 * "types at call sites come from the real package" premise.
 */
export type TMapView = RNMapView;

export type TMapLatLng = {
  lat: number;
  lng: number;
};

export type TMapDeltaLatLng = {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type RegionDeltaSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
