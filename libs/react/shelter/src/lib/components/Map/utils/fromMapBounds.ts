import { TMapBounds } from '../types.maps';

export function fromMapBounds(bounds: TMapBounds): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    { lat: bounds.southLat, lng: bounds.westLng },
    { lat: bounds.northLat, lng: bounds.eastLng }
  );
}
