import { RefObject } from 'react';
import { TMapView } from '../types';

type TProps = {
  mapRef: RefObject<TMapView | null>;
  center: {
    latitude: number;
    longitude: number;
  };
  duration?: number;
};

export async function panMap(props: TProps) {
  const { mapRef, center, duration = 300 } = props;

  const map = mapRef.current;

  if (!map) {
    return;
  }

  const currentCamera = await map.getCamera();

  map.animateCamera(
    {
      ...currentCamera,
      center,
    },
    { duration }
  );
}
