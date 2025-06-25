import { PermissionStatus } from 'expo-location';
import { RefObject } from 'react';
import { TMapDeltaLatLng, TMapView } from '../types';
import { getUserLocation } from './getUserLocation';
import { goToLocation } from './goToLocation';

type TProps = {
  mapRef: RefObject<TMapView | null>;
  regionDelta?: TMapDeltaLatLng;
  duration?: number;
  onPermissionDenied?: () => void;
};

export async function goToUserLocation(props: TProps) {
  const { mapRef, regionDelta, duration, onPermissionDenied } = props;

  if (!mapRef.current) {
    return;
  }

  const { location, permissionStatus } = await getUserLocation();

  if (permissionStatus !== PermissionStatus.GRANTED) {
    onPermissionDenied?.();

    return;
  }

  if (!location?.coords) {
    return;
  }

  await goToLocation({
    mapRef,
    coordinates: location.coords,
    regionDelta,
    duration,
  });
}
