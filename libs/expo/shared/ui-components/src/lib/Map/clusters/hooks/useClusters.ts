import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { Region } from 'react-native-maps';
import { PointFeature } from 'supercluster';
import { TMapView } from '../../types';
import { regionToBbox, regionToZoom, zoomCamera } from '../../utils';
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

  const setClustersForRegion = useCallback(
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
  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      setClustersForRegion(region);
    },
    [clusterManager, pointFeatures.length]
  );

  const zoomToCluster = useCallback(
    async (cluster: TClusterPoint, mapRef: RefObject<TMapView | null>) => {
      if (!mapRef.current) {
        return;
      }

      const [lng, lat] = cluster.geometry.coordinates;
      let nextZoom = clusterManager.getClusterExpansionZoom(
        cluster.properties.cluster_id
      );

      const currentCamera = await mapRef.current?.getCamera?.();
      const currentZoom = currentCamera?.zoom;
      const ceilCurrent = currentZoom ? Math.ceil(currentZoom) : null;
      const ceilTarget = Math.ceil(nextZoom);

      // manually increment zoom level if same, as getClusterExpansionZoom
      // returns floats and sometimes may even return same zoom as current
      if (ceilCurrent !== null && ceilTarget === ceilCurrent) {
        nextZoom = ceilTarget + 1;
      }

      // zoomCamera uses animateCamera instead of animateToRegion (as with animateToCluster)
      // and should have smoother transition. The nextZoom manual adjustment
      // (nextZoom = ceilTarget + 1) also  helps with edge cases
      // where camera fails to zoom for whatever reason.
      zoomCamera({
        mapRef,
        zoom: nextZoom,
        latitude: lat,
        longitude: lng,
      });
    },
    [clusterManager]
  );

  // cleanup
  useEffect(() => () => clusterManager.clear(), [clusterManager]);

  return {
    clusters,
    clusterManager,
    onRegionChangeComplete,
    zoomToCluster,
  };
}
