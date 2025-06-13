import { MapPinIcon } from '@monorepo/expo/shared/icons';
import {
  ClusterMap,
  ClusterOrPoint,
  LoadingView,
  MapClusterManager,
  MapClusterMarker,
  RegionDeltaSize,
  regionToBbox,
  regionToZoom,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { PointFeature } from 'supercluster';
import { Ordering, TNotesQueryInteraction } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useGetClientInteractionsWithLocation } from '../../../hooks/interactions/useGetClientInteractionsWithLocation';
import { TMapView } from '../../../maps';
import { EmptyState } from './EmptyState';
import { InteractionClusters } from './InteractionClusters';
import { getInteractionsMapRegion } from './utils/getInteractionsMapRegion';

const MAP_DELTA_SIZE: RegionDeltaSize = 'XL';

type TProps = {
  clientProfileId: string;
};

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { showSnackbar } = useSnackbar();
  const [clusters, setClusters] = useState<
    ClusterOrPoint<TNotesQueryInteraction>[]
  >([]);

  // 1. Fetch interactions
  const {
    interactions: interactionsWithLocation,
    loading,
    error,
  } = useGetClientInteractionsWithLocation({
    id: clientProfileId,
    dateSort: Ordering.Desc,
  });

  // 2) Build pointFeatures carrying the *full* interaction payload
  const pointFeatures = useMemo<PointFeature<TNotesQueryInteraction>[]>(() => {
    if (!interactionsWithLocation) {
      return [];
    }

    return interactionsWithLocation.map((i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: i.location!.point },
      properties: i,
    }));
  }, [interactionsWithLocation]);

  const clusterManager = useMemo(() => {
    const cm = new MapClusterManager<TNotesQueryInteraction>();
    cm.load(pointFeatures);

    return cm;
  }, [pointFeatures]);

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      const bbox = regionToBbox(region);
      const zoom = regionToZoom(region);
      const next = clusterManager.getClusters(bbox, zoom);

      setClusters(next);
    },
    [clusterManager, regionToBbox, regionToZoom]
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
    <ClusterMap
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
        clusterRenderer={(cluster) => {
          return (
            <MapClusterMarker itemCount={cluster.properties.point_count} />
          );
        }}
        onClusterPress={(cluster) =>
          clusterManager.zoomToCluster(cluster.properties.cluster_id, mapRef)
        }
        pointRenderer={() => {
          return <MapPinIcon size="M" variant="primary" />;
        }}
      />
    </ClusterMap>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
