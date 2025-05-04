import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { LatLngLiteral } from '../types.maps';

export function useCenterSync(targetCenter: LatLngLiteral | null | undefined) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCenter) {
      return;
    }

    map.setCenter(targetCenter);
  }, [map, targetCenter]);
}
