import { LatLngLiteral, TLatLng } from '../types.maps';

export function toGoogleLatLngLiteral(
  coords: TLatLng | LatLngLiteral
): LatLngLiteral {
  const { lat, lng } = coords as LatLngLiteral;

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
