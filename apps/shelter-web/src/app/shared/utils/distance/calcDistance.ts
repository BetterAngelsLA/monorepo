import haversine from 'haversine-distance';
import { TLatLng } from '../../components/maps/types.maps';
import { metersToMiles } from './convert';

type TParams = {
  pointA: TLatLng;
  pointB: TLatLng;
  units?: 'miles' | 'meters';
};

export function calcDistance(params: TParams) {
  const { pointA, pointB, units = 'miles' } = params;

  const distanceMeters = haversine(pointA, pointB);

  if (units === 'meters') {
    return distanceMeters;
  }

  return metersToMiles(distanceMeters);
}
