import { IClusterGeoJson, TClusterPoint } from '../types';

export function generateClusterHash<P extends IClusterGeoJson>(
  cluster: TClusterPoint<P>
): string {
  const { cluster_id, point_count } = cluster.properties;
  const [lng, lat] = cluster.geometry.coordinates;

  return `cluster_${cluster_id}_${point_count}_${lng}_${lat}`;
}
