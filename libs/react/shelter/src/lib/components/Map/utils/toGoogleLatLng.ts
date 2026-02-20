import { TLatLng } from '../types.maps';

export function toGoogleLatLng(
  coords?: TLatLng | google.maps.LatLngLiteral | null
): google.maps.LatLngLiteral | null | undefined {
  if (!coords) {
    return coords;
  }

  const { lat, lng } = coords as google.maps.LatLngLiteral;

  if (lat && lng) {
    return {
      lat,
      lng,
    };
  }

  return {
    lat: (coords as TLatLng).latitude,
    lng: (coords as TLatLng).longitude,
  };
}
