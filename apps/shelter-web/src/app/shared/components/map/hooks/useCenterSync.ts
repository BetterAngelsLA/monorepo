import { useMap } from '@vis.gl/react-google-maps';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { LatLngLiteral } from '../types.maps';

export function useCenterSync(
  targetCenter: LatLngLiteral | null | undefined,
  setSearchAreaControlVisible?: Dispatch<SetStateAction<boolean>>
) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCenter) {
      return;
    }

    console.log('*****************  useCenterSync:', targetCenter);

    map.setCenter(targetCenter);
    // setSearchAreaControlVisible?.(true);
  }, [map, targetCenter]);
}
