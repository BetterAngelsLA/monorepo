// goToUserLocation.ts

import { RefObject } from 'react';
import { TRNMapView } from '../mapLib';
import { TMapDeltaLatLng } from '../types';
import { getUserLocation } from './getUserLocation';
import { goToLocation } from './goToLocation';

type TProps = {
  mapRef: RefObject<TRNMapView | null>;
  regionDelta?: TMapDeltaLatLng;
  duration?: number;
};

export async function goToUserLocation(props: TProps) {
  const { mapRef, regionDelta, duration } = props;

  if (!mapRef.current) {
    return;
  }

  const userLocation = await getUserLocation();

  if (!userLocation) {
    return;
  }

  await goToLocation({
    mapRef,
    coordinates: userLocation,
    regionDelta,
    duration,
  });
}
