import { useMap } from '@vis.gl/react-google-maps';
import { useRef } from 'react';
import type { TMapState } from '../types.maps';
import { getMapState } from '../utils/getMapState';
import { useOnMapIdle } from './useOnMapIdle';

export function useMapLifecycle(
  userLocation: google.maps.LatLngLiteral | null | undefined,
  onInit?: (state: TMapState) => void,
  onIdle?: (state: TMapState) => void,
  onCenterInit?: (state: TMapState) => void
) {
  const map = useMap();
  const initFiredRef = useRef(false);
  const centerFiredRef = useRef(false);

  // onInit and onIdle subscriber
  useOnMapIdle(() => {
    if (!map) {
      return;
    }

    const state = getMapState(map);

    if (!state) {
      return;
    }

    onIdle?.(state);

    // onInit only fires on first onIdle
    if (!initFiredRef.current) {
      initFiredRef.current = true;

      onInit?.(state);
    }
  });

  // onCenterInit subscriber
  // skip if
  // 1. onInit hasn't fired (first onIdle)
  // 2. onCenterInit alreay fired
  // 3. we already have userLocation
  if (onCenterInit) {
    useOnMapIdle(() => {
      const skipEvent =
        !map ||
        !initFiredRef.current ||
        centerFiredRef.current ||
        userLocation === undefined;

      if (skipEvent) {
        return;
      }

      const state = getMapState(map);

      if (state) {
        centerFiredRef.current = true;

        onCenterInit(state);
      }
    });
  }
}
