import { ClusterOrPoint, IClusterGeoJson } from '../types';

export function areClustersEqual<P extends IClusterGeoJson>(
  a: ClusterOrPoint<P>[],
  b: ClusterOrPoint<P>[]
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  // assumes array order does not matter
  const keysA = a.map((c) => c.properties._identityHash).sort();
  const keysB = b.map((c) => c.properties._identityHash).sort();

  return keysA.every((k, i) => k === keysB[i]);
}
