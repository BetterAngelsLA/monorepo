import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  LoadingView,
  MapClusterMarker,
  MapClusters,
  MapViewport,
  TClusterPoint,
  TMapView,
  regionDeltaMap,
  useClusters,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { useSnackbar } from '../../../../hooks';
import { EmptyState } from '../EmptyState';
import { useInteractionPointFeatures } from './hooks/useInteractionPointFeatures';
import { useInteractionsMapRegion } from './hooks/useInteractionsMapRegion';
import { useInteractionsMapState } from './hooks/useInteractionsMapState';
import { TClusterInteraction } from './types';

type TProps = {
  clientProfileId: string;
};

export function InteractionsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { setMapState } = useInteractionsMapState();
  const { showSnackbar } = useSnackbar();

  // 1. Pull data
  const { pointFeatures, loading, error, interactions } =
    useInteractionPointFeatures(clientProfileId);

  // 2. Derive clusters
  const { clusters, updateClustersForRegion, zoomToCluster } =
    useClusters<TClusterInteraction>({
      pointFeatures,
      opts: {
        radius: 50,
        edgePadding: [
          { max: 4, padding: { top: 80, bottom: 80, left: 100, right: 100 } },
          {
            max: Infinity,
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
          },
        ],
      },
    });

  const mapRegion = useInteractionsMapRegion({
    interaction: interactions?.[0],
    delta: regionDeltaMap.M,
  });

  function onRegionChangeComplete(region: Region) {
    updateClustersForRegion(region);

    setMapState((prev) => ({ ...prev, region }));
  }

  const renderClusterIconFn = useMemo(
    () => (cluster: TClusterPoint) =>
      <MapClusterMarker itemCount={cluster.properties.point_count} />,
    []
  );

  const renderPointIconFn = useMemo(
    () => () => <LocationPinIcon width={25} height={36} />,
    []
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
  if (interactions === undefined) {
    return null;
  }

  if (!interactions?.length) {
    return <EmptyState />;
  }

  if (!mapRegion) {
    return null;
  }

  async function onMarkerPress(interactionId: string) {
    const interaction = interactions?.find((i) => i.id === interactionId);

    if (!interaction) {
      return;
    }

    setMapState((prev) => ({
      ...prev,
      selectedInteractions: [interaction],
    }));
  }

  return (
    <MapViewport
      ref={mapRef}
      enableUserLocation={true}
      style={styles.map}
      provider="google"
      initialRegion={mapRegion}
      onRegionChangeComplete={onRegionChangeComplete}
      onMapReady={() => {
        updateClustersForRegion(mapRegion);
      }}
    >
      <MapClusters
        mapRef={mapRef}
        clusters={clusters}
        clusterRenderer={renderClusterIconFn}
        pointRenderer={renderPointIconFn}
        onClusterPress={(c) => zoomToCluster(c, mapRef)}
        onPointPress={(p) => onMarkerPress(p.properties.id)}
      />
    </MapViewport>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
