import { TMapView } from '@monorepo/expo/shared/ui-components';
import { Region } from 'react-native-maps';
import Supercluster from 'supercluster';

export function zoomToCluster(
  mapRef: React.RefObject<TMapView | null>,
  supercluster: Supercluster<any>,
  clusterId: number,
  options?: {
    paddingMultiplier?: number;
    animateDuration?: number;
    fallbackDelta?: number;
  }
) {
  const {
    paddingMultiplier = 2,
    animateDuration = 250,
    fallbackDelta = 0.02,
  } = options || {};

  if (!mapRef?.current) {
    console.warn('zoomToCluster: missing mapRef.current');

    return;
  }

  const leaves = supercluster.getLeaves(clusterId, 100);

  if (!leaves.length) {
    return;
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const leaf of leaves) {
    const [lng, lat] = leaf.geometry.coordinates;

    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = (maxLat - minLat) * paddingMultiplier || fallbackDelta;
  const longitudeDelta = (maxLng - minLng) * paddingMultiplier || fallbackDelta;

  const region: Region = {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };

  mapRef.current.animateToRegion(region, animateDuration);
}
