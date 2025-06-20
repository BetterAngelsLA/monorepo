import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { Region } from 'react-native-maps';
import { PointFeature } from 'supercluster';
import { TMapView } from '../../types';
import { regionToBbox, regionToZoom } from '../../utils';
import { IMapClusterManager } from '../MapClusterManager';
import { ClusterOrPoint, IClusterGeoJson, TClusterPoint } from '../types';
import { useMapClusterManager } from './useMapClusterManager';

type TProps<P> = {
  pointFeatures: PointFeature<P>[];
  opts?: IMapClusterManager;
};

export function useClusters<P extends IClusterGeoJson>(props: TProps<P>) {
  const { pointFeatures, opts } = props;

  const [clusters, setClusters] = useState<ClusterOrPoint<P>[]>([]);
  const clusterManager = useMapClusterManager<P>(opts);

  // Hash IDs to detect changes
  const pointFeaturesHash = useMemo(
    () =>
      pointFeatures
        .map((f) => String(f.properties.id))
        .sort()
        .join('|'),
    [pointFeatures]
  );

  const updateClustersForRegion = useCallback(
    (region: Region) => {
      if (!pointFeatures.length) {
        setClusters([]);
        return;
      }
      const bbox = regionToBbox(region);
      const zoom = regionToZoom(region);

      setClusters(clusterManager.getClusters(bbox, zoom));
    },
    [clusterManager, pointFeatures.length]
  );

  // Load once per hash change
  useEffect(() => {
    clusterManager.load(pointFeatures);

    if (!pointFeatures.length) {
      setClusters([]);
    }
  }, [pointFeaturesHash, clusterManager]);

  // When map moves/zooms
  const onRegionChange = useCallback(
    (region: Region) => {
      updateClustersForRegion(region);
    },
    [clusterManager, pointFeatures.length]
  );

  const zoomToCluster = useCallback(
    (c: TClusterPoint, mapRef: RefObject<TMapView | null>) =>
      clusterManager.fitToCluster(c.properties.cluster_id, mapRef),
    [clusterManager]
  );

  // cleanup
  useEffect(() => () => clusterManager.clear(), [clusterManager]);

  return {
    clusters,
    updateClustersForRegion,
    zoomToCluster,
  };
}
