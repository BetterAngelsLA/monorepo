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
      setClusters([]);

      return;
    }

    const bbox = regionToBbox(lastRegionRef.current);
    const zoom = regionToZoom(lastRegionRef.current);
    const newClusters = clusterManager.getClusters(bbox, zoom);

    setClusters((prev) => {
      const noChange = areClustersEqual(prev, newClusters);

      if (noChange) {
        return prev;
      }

      return newClusters;
    });
  }, [clusterManager, pointFeatures.length]);

  const updateClustersForRegion = useCallback(
    (region: Region) => {
      lastRegionRef.current = region;

      updateClusters();
    },
    [updateClusters],
  );

  // Load features whenever pointFeaturesHash changes
  // pointFeaturesHash captures meaningful content changes;
  // pointFeatures itself is intentionally omitted to avoid
  // re-running on reference-only changes.
  useEffect(() => {
    if (!pointFeatures.length) {
      return;
    }

    clusterManager.load(pointFeatures);

    // refresh clusters on map
    updateClusters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointFeaturesHash, clusterManager, updateClusters]);

  const zoomToCluster = useCallback(
    async (c: TClusterPoint, mapRef: RefObject<TMapView | null>) => {
      const region = await clusterManager.fitToCluster(
        c.properties.cluster_id,
        mapRef,
      );

      // Recompute for where the fit ended up. Web fires no region callback for a
      // programmatic move, so without this the layer keeps rendering the clusters
      // it computed at the previous zoom — a cluster that no longer matches the
      // map and cannot be opened.
      if (region) updateClustersForRegion(region);
    },
    [clusterManager, updateClustersForRegion],
  );

  /** See `canExpandFurther` on the manager. */
  const canExpandFurther = useCallback(
    (c: TClusterPoint, currentZoom?: number) =>
      clusterManager.canExpandFurther(c.properties.cluster_id, currentZoom),
    [clusterManager],
  );

  /** The points inside `c`, for when the cluster cannot be broken up further. */
  const getClusterLeaves = useCallback(
    (c: TClusterPoint) => clusterManager.getLeaves(c.properties.cluster_id),
    [clusterManager],
  );

  // cleanup
  useEffect(() => () => clusterManager.clear(), [clusterManager]);

  return {
    clusters,
    updateClustersForRegion,
    zoomToCluster,
    canExpandFurther,
    getClusterLeaves,
  };
}
