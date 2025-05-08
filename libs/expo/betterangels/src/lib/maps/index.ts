import Maps from './map';

import RNMapView from 'react-native-maps';

type TMapView = RNMapView; // pointing to RN for type as react-native-web-maps MapView breaks typings
const MapView = Maps.default;
const Marker = Maps.Marker;
const PROVIDER_GOOGLE = Maps?.PROVIDER_GOOGLE || 'google';

export { MapView, Marker, PROVIDER_GOOGLE, TMapView };
