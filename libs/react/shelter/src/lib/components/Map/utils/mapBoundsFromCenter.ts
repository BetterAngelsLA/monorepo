import {
  DEFAULT_BOUNDS_MILES,
  MILES_TO_DEGREES_AT_EQUATOR,
} from '../constants.maps';
import { TLatLng, TMapBounds } from '../types.maps';

/** Builds map-bounds filter input centered on a point with a minimum radius in miles. */
export function mapBoundsFromCenter(
  center: TLatLng,
  radiusMiles = DEFAULT_BOUNDS_MILES
): TMapBounds {
  const halfLat = radiusMiles / 2 / MILES_TO_DEGREES_AT_EQUATOR;
  const cosLat = Math.cos((center.latitude * Math.PI) / 180) || 1e-6;
  const halfLng = radiusMiles / 2 / (MILES_TO_DEGREES_AT_EQUATOR * cosLat);

  return {
    westLng: center.longitude - halfLng,
    eastLng: center.longitude + halfLng,
    northLat: center.latitude + halfLat,
    southLat: center.latitude - halfLat,
  };
}
