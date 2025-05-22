import { Region } from 'react-native-maps';
import { TMapLatLng } from './types';

// geocode for approx center of LA COUNTY
export const LA_COUNTY_CENTER_LAT = 34.04499;
export const LA_COUNTY_CENTER_LNG = -118.251601;

export const LA_COUNTY_CENTER: TMapLatLng = {
  lat: LA_COUNTY_CENTER_LAT,
  lng: LA_COUNTY_CENTER_LNG,
};

export const defaultMapRegion: Region = {
  longitudeDelta: 0.1,
  latitudeDelta: 0.1,
  latitude: LA_COUNTY_CENTER.lat,
  longitude: LA_COUNTY_CENTER.lng,
};
