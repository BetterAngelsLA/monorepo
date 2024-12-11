import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import {
  DEFAULT_BOUNDS_MILES,
  MILES_TO_DEGREES_AT_EQUATOR,
} from './constants.maps';
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

// TEMP: is done in another PR
type TGetPlacesBounds = {
  boundsCenter: TLatLng;
  boundsRadiusMiles?: number;
};

export function getPlacesBounds(
  props: TGetPlacesBounds
): google.maps.LatLngBoundsLiteral {
  const { boundsCenter, boundsRadiusMiles = DEFAULT_BOUNDS_MILES } = props;

  const boundsRadiusDegrees = boundsRadiusMiles / MILES_TO_DEGREES_AT_EQUATOR;

  return {
    north: boundsCenter.lat + boundsRadiusDegrees,
    south: boundsCenter.lat - boundsRadiusDegrees,
    east: boundsCenter.lng + boundsRadiusDegrees,
    west: boundsCenter.lng - boundsRadiusDegrees,
  };
}
