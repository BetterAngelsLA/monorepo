// goToUserLocation.ts

import { RefObject } from 'react';
import { TRNMapView } from '../mapLib';
import { getUserLocation } from './getUserLocation';
import { goToLocation } from './goToLocation';

type TProps = {
  mapRef: RefObject<TRNMapView | null>;
  latDelta?: number;
  lngDelta?: number;
  duration?: number;
};

export async function goToUserLocation(props: TProps) {
  const { mapRef } = props;

  if (!mapRef.current) {
    return;
  }

  const userLocation = await getUserLocation();

  if (!userLocation) {
    return;
  }

  await goToLocation({
    ...props,
    coordinates: userLocation,
  });
}
