import { TMapBounds } from '../types.maps';

export function toBoundsLiteral(
  bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral
): google.maps.LatLngBoundsLiteral {
  let literal: google.maps.LatLngBoundsLiteral;

  if (typeof (bounds as google.maps.LatLngBounds).toJSON === 'function') {
    return (bounds as google.maps.LatLngBounds).toJSON();
  }

  return bounds as google.maps.LatLngBoundsLiteral;
}

export function toTMapBounds(
  bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral
): TMapBounds {
  const { west, north, east, south } = toBoundsLiteral(bounds);

  return {
    westLng: west,
    northLat: north,
    eastLng: east,
    southLat: south,
  };
}
