import RNMapView, {
  configureWebMaps,
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from './mapsApi';

export * from './clusters';
export * from './constants';
export { defaultMapRegion, regionDeltaMap } from './constants';
export { MapViewport } from './MapViewport';
export * from './types';
export * from './utils';
export {
  RNMapView as MapView,
  configureWebMaps,
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
};

export { LocationMarker } from './LocationMarker';
export { MapDirectionsActionSheet } from './MapDirectionsActionSheet';
export { MapLocationPicker } from './MapLocationPicker';
export type {
  IMapLocationPickerProps,
  TLocationData,
} from './MapLocationPicker/types';
