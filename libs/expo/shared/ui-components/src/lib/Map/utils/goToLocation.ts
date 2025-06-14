import { TMapView } from '@monorepo/maps';
import * as Location from 'expo-location';
import { RefObject } from 'react';
import { Region } from 'react-native-maps';
import { defaultAnimationDuration, defaultRegionDelta } from '../constants';
import { TMapDeltaLatLng } from '../types';

type TProps = {
  mapRef: RefObject<TMapView | null>;
  coordinates: Location.LocationObjectCoords;
  regionDelta?: TMapDeltaLatLng;
  duration?: number;
};

export async function goToLocation(props: TProps) {
  const {
    mapRef,
    coordinates,
    regionDelta = defaultRegionDelta,
    duration = defaultAnimationDuration,
  } = props;

  if (!mapRef.current) {
    return;
  }

  const region: Region = {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    ...regionDelta,
  };

  mapRef.current.animateToRegion(region, duration);
}
