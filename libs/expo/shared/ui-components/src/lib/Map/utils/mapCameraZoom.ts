import { RefObject } from 'react';
import { defaultAnimationDuration } from '../constants';
import { TMapView } from '../types';

type TProps = {
  mapRef: RefObject<TMapView | null>;
  latitude: number;
  longitude: number;
  zoom: number;
  duration?: number;
};

export function mapCameraZoom(props: TProps) {
  const {
    mapRef,
    zoom,
    latitude,
    longitude,
    duration = defaultAnimationDuration,
  } = props;

  if (!mapRef.current || !zoom || !latitude || !longitude) {
    return;
  }

  mapRef.current.animateCamera(
    {
      center: { latitude, longitude },
      zoom,
      heading: 0,
      pitch: 0,
    },
    { duration }
  );
}
