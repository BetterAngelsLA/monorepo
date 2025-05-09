import { laLocations } from '../locations';
import { TGeoFeature } from '../types';

export function getGeoPoints(): TGeoFeature[] {
  const tsStart = Date.now();

  const points: TGeoFeature[] = laLocations.map((loc, id) => ({
    type: 'Feature',
    properties: { pointId: id, name: loc.name },
    geometry: {
      type: 'Point',
      coordinates: [loc.longitude, loc.latitude],
    },
  }));
  console.log(
    '################################### GET_POINTS: ',
    Date.now() - tsStart
  );

  return points;
}
