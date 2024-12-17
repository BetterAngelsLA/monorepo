import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { getPlacesBounds } from './getPlacesBounds';
import { TLatLng } from './types.maps';

interface MapHandlerProps {
  center?: TLatLng | null;
}

export const MapHandler = ({ center }: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) {
      return;
    }

    const bounds = getPlacesBounds({
      boundsCenter: center,
    });

    map.fitBounds(bounds);
  }, [map, center]);

  return null;
};
