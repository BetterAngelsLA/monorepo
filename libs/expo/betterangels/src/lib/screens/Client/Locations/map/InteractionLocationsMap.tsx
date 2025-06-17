import { MapPinIcon } from '@monorepo/expo/shared/icons';
import {
  ClusterOrPoint,
  IClusterGeoJson,
  LoadingView,
  MapClusterMarker,
  MapViewport,
  RegionDeltaSize,
  TClusterPoint,
  TMapView,
  regionToBbox,
  regionToZoom,
  useMapClusterManager,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { PointFeature } from 'supercluster';
import { Ordering } from '../../../../apollo';
import {
  useGetClientInteractionsWithLocation,
  useSnackbar,
} from '../../../../hooks';
import { EmptyState } from '../EmptyState';
import { getInteractionsMapRegion } from '../utils/getInteractionsMapRegion';
import { InteractionClusters } from './InteractionClusters';

const MAP_DELTA_SIZE: RegionDeltaSize = 'XL';

interface TClusterInteraction extends IClusterGeoJson {
  interactedAt: Date;
}

type TProps = {
  clientProfileId: string;
};

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { showSnackbar } = useSnackbar();
  const [clusters, setClusters] = useState<
    ClusterOrPoint<TClusterInteraction>[]
  >([]);

  const {
    interactions: interactionsWithLocation,
    loading,
    error,
  } = useGetClientInteractionsWithLocation({
    id: clientProfileId,
    dateSort: Ordering.Desc,
  });

  const pointFeatures = useMemo<PointFeature<TClusterInteraction>[]>(() => {
    if (!interactionsWithLocation) {
      return [];
    }

    return interactionsWithLocation.map((i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: i.location!.point },
      properties: {
        id: i.id,
        interactedAt: new Date(i.interactedAt),
      },
    }));
  }, [interactionsWithLocation]);

  // Hash pointFeature Interaction IDs to only run
  // clusterManager.load(pointFeatures) when pointFeatures change
  const pointFeaturesHash = useMemo(
    () =>
      pointFeatures
        .map((f) => f.properties.id)
        .sort()
        .join('|'),
    [pointFeatures]
  );

  const clusterManager = useMapClusterManager<TClusterInteraction>();

  useEffect(() => {
    if (pointFeatures.length === 0) return;

    console.log('############## LOAD POINT FEATURES: ', Date.now());
    clusterManager.load(pointFeatures);
  }, [pointFeaturesHash]);

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      const bbox = regionToBbox(region);
      const zoom = regionToZoom(region);
      const next = clusterManager.getClusters(bbox, zoom);

      setClusters(next);
    },
    [clusterManager, regionToBbox, regionToZoom]
  );

  const renderClusterIconFn = useMemo(
    () => (cluster: TClusterPoint) =>
      <MapClusterMarker itemCount={cluster.properties.point_count} />,
    []
  );

  const renderPointIconFn = useMemo(
    () => () => <MapPinIcon size="M" variant="primary" />,
    []
  );

  const handleClusterPressCb = useCallback(
    (cluster: TClusterPoint) =>
      clusterManager.zoomToCluster(cluster.properties.cluster_id, mapRef),
    [clusterManager, mapRef]
  );

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    showSnackbar({
      message: 'Sorry, we could not load the interactions. Please try again.',
      type: 'error',
    });

    return null;
  }

  // unless loading, render nothing until interactions are defined
  if (interactionsWithLocation === undefined) {
    return null;
  }

  if (!interactionsWithLocation?.length) {
    return <EmptyState />;
  }

  const mapRegion = getInteractionsMapRegion({
    interaction: interactionsWithLocation[0],
    deltaSize: MAP_DELTA_SIZE,
  });

  if (!mapRegion) {
    return null;
  }

  return (
    <MapViewport
      mapRef={mapRef}
      enableUserLocation={true}
      style={styles.map}
      provider="google"
      initialRegion={mapRegion}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      <InteractionClusters
        mapRef={mapRef}
        clusters={clusters}
        clusterRenderer={renderClusterIconFn}
        pointRenderer={renderPointIconFn}
        onClusterPress={handleClusterPressCb}
      />
    </MapViewport>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
