import { TMapBounds } from '../types.maps';

function clampLat(v: number): number {
  return Math.max(-90, Math.min(90, v));
}

function clampLng(v: number): number {
  return Math.max(-180, Math.min(180, v));
}

export function toMapBounds(bounds: google.maps.LatLngBounds): TMapBounds {
  const {
    west: westLng,
    north: northLat,
    east: eastLng,
    south: southLat,
  } = bounds.toJSON();

  return {
    westLng: clampLng(westLng),
    northLat: clampLat(northLat),
    eastLng: clampLng(eastLng),
    southLat: clampLat(southLat),
  };
}
