import RNMapView from 'react-native-maps';

export { RNMapView as TMapView };

export type TMapLatLng = {
  lat: number;
  lng: number;
};

export type TMapDeltaLatLng = {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type RegionDeltaSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
