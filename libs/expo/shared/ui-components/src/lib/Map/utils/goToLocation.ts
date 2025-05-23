import * as Location from 'expo-location';
import { RefObject } from 'react';
import { Region } from 'react-native-maps';
import { defaultAnimationDuration } from '../constants';
import { TRNMapView } from '../mapLib';

type TProps = {
  coordinates: Location.LocationObjectCoords;
  mapRef: RefObject<TRNMapView | null>;
  latDelta?: number;
  lngDelta?: number;
  duration?: number;
};

export async function goToLocation(props: TProps) {
  const {
    mapRef,
    coordinates,
    latDelta = 0.05,
    lngDelta = 0.05,
    duration = defaultAnimationDuration,
  } = props;

  if (!mapRef.current) {
    return;
  }

  const region: Region = {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };

  mapRef.current.animateToRegion(region, duration);
}
