import {
  DEFAULT_BOUNDS_MILES,
  LA_COUNTY_CENTER,
  MILES_TO_DEGREES_AT_EQUATOR,
} from '../constants.maps';
import { TLatLng } from '../types.maps';
import { toGoogleLatLng } from './toGoogleLatLng';

type TGetPlacesBounds = {
  boundsCenter?: TLatLng | google.maps.LatLngLiteral;
  boundsRadiusMiles?: number;
};

export function getPlacesBounds(
  props: TGetPlacesBounds
): google.maps.LatLngBoundsLiteral {
  const {
    boundsCenter = LA_COUNTY_CENTER,
    boundsRadiusMiles = DEFAULT_BOUNDS_MILES,
  } = props;

  const boundsRadiusDegrees = boundsRadiusMiles / MILES_TO_DEGREES_AT_EQUATOR;

  const center = toGoogleLatLng(boundsCenter) as google.maps.LatLngLiteral;

  return {
    north: center.lat + boundsRadiusDegrees,
    south: center.lat - boundsRadiusDegrees,
    east: center.lng + boundsRadiusDegrees,
    west: center.lng - boundsRadiusDegrees,
  };
}
