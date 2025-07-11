import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Region } from 'react-native-maps';
import { PointFeature } from 'supercluster';
import { TMapView } from '../../types';
import { regionToBbox, regionToZoom } from '../../utils';
import { IMapClusterManager } from '../MapClusterManager';
import { ClusterOrPoint, IClusterGeoJson, TClusterPoint } from '../types';
import { areClustersEqual } from '../utils/areClustersEqual';
import { useMapClusterManager } from './useMapClusterManager';

type TProps<P> = {
  pointFeatures: PointFeature<P>[];
  opts?: IMapClusterManager;
};

export function useClusters<P extends IClusterGeoJson>(props: TProps<P>) {
  const { pointFeatures, opts } = props;

  const [clusters, setClusters] = useState<ClusterOrPoint<P>[]>([]);

  const clusterManager = useMapClusterManager<P>(opts);

  const lastRegionRef = useRef<Region | null>(null);

  // Hash pointFeature _identityHashes to detect value change
  const pointFeaturesHash = useMemo(() => {
    return pointFeatures
      .map((f) => f.properties._identityHash)
      .sort()
      .join('|');
  }, [pointFeatures]);

  const updateClusters = useCallback(() => {
    // no map yet, nothing to cluster
    if (!lastRegionRef.current) {
      return;
    }

    // no data, reset state
    if (!pointFeatures.length) {
      setClusters((prev) => (prev.length ? [] : prev));

      return;
    }

    const bbox = regionToBbox(lastRegionRef.current);
    const zoom = regionToZoom(lastRegionRef.current);
    const next = clusterManager.getClusters(bbox, zoom);

    setClusters((prev) => {
      const noChange = areClustersEqual(prev, next);

      if (noChange) {
        return prev;
      }

      return next;
    });
  }, [clusterManager, pointFeatures.length]);

  const updateClustersForRegion = useCallback(
    (region: Region) => {
      lastRegionRef.current = region;

      updateClusters();
    },
    [updateClusters]
  );

  // Load features whenever pointFeaturesHash changes
  useEffect(() => {
    if (!pointFeatures.length) {
      return;
    }

    clusterManager.load(pointFeatures);

    // refresh clusters on map
    updateClusters();
  }, [pointFeaturesHash, clusterManager, updateClusters]);

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
