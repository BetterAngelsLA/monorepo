import {
  LA_COUNTY_CENTER_LAT,
  LA_COUNTY_CENTER_LNG,
  MILES_TO_DEGREES_AT_EQUATOR,
} from './constants.maps';
import { TLatLng } from './types.maps';

const DEFAULT_BOUNDS_MILES = 10;

export const LA_COUNTY_CENTER: TLatLng = {
  lat: LA_COUNTY_CENTER_LAT,
  lng: LA_COUNTY_CENTER_LNG,
};

type TGetPlacesBounds = {
  boundsCenter?: TLatLng;
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

  return {
    north: boundsCenter.lat + boundsRadiusDegrees,
    south: boundsCenter.lat - boundsRadiusDegrees,
    east: boundsCenter.lng + boundsRadiusDegrees,
    west: boundsCenter.lng - boundsRadiusDegrees,
  };
}
