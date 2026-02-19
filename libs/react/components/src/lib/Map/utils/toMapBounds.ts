/// <reference types="google.maps" />
import { TMapBounds } from '../types.maps';

export function toMapBounds(bounds: google.maps.LatLngBounds): TMapBounds {
  const {
    west: westLng,
    north: northLat,
    east: eastLng,
    south: southLat,
  } = bounds.toJSON();

  return { westLng, northLat, eastLng, southLat };
}
