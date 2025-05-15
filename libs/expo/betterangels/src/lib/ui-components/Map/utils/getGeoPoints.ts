import { TCoordinates, TGeoPoint } from '../types';

export function getGeoPoints<T extends TCoordinates>(
  locations: T[]
): TGeoPoint<T>[] {
  return locations.map((loc, id) => ({
    type: 'Feature',
    properties: {
      pointId: id,
      ...loc,
    },
    geometry: {
      type: 'Point',
      coordinates: [loc.longitude, loc.latitude],
    },
  }));
}
