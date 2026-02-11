import RNMapView, {
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

export * from './clusters';
export * from './constants';
export { defaultMapRegion, regionDeltaMap } from './constants';
export { MapViewport } from './MapViewport';
export * from './types';
export * from './utils';
export { RNMapView as MapView, Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT };

export { LocationMarker } from './LocationMarker';
export { MapDirectionsActionSheet } from './MapDirectionsActionSheet';
export { MapLocationPicker } from './MapLocationPicker';
export type {
  IMapLocationPickerProps,
  TLocationData,
} from './MapLocationPicker/types';
