import Maps from './map';

import RNMapViewRaw from 'react-native-maps';

// TRNMapView pointing to RN for type as react-native-web-maps MapView breaks typings.
// Exporting RNMapView and not MapView as MapView is used as component name,
// due to TS conflicts with Map constructor.

type TRNMapView = RNMapViewRaw;
const RNMapView = Maps.default;
const Marker = Maps.Marker;
const PROVIDER_GOOGLE = Maps?.PROVIDER_GOOGLE || 'google';

export { Marker, PROVIDER_GOOGLE, RNMapView, TRNMapView };
