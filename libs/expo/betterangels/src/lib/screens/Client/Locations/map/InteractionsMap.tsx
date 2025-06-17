import { MapPinIcon } from '@monorepo/expo/shared/icons';
import {
  LoadingView,
  MapClusterMarker,
  MapClusters,
  MapViewport,
  TClusterPoint,
  TMapView,
  useClusters,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSnackbar } from '../../../../hooks';
import { EmptyState } from '../EmptyState';
import { getInteractionsMapRegion } from './getInteractionsMapRegion';
import { TClusterInteraction } from './types';
import { useInteractionPointFeatures } from './useInteractionPointFeatures';

type TProps = {
  clientProfileId: string;
};

export function InteractionsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { showSnackbar } = useSnackbar();

  // 1. Pull data
  const { pointFeatures, loading, error, interactions } =
    useInteractionPointFeatures(clientProfileId);

  // 2. Derive clusters
  const { clusters, onRegionChangeComplete, zoomToCluster } =
    useClusters<TClusterInteraction>({
      pointFeatures,
      opts: {
        radius: 50,
      },
    });

  const renderClusterIconFn = useMemo(
    () => (cluster: TClusterPoint) =>
      <MapClusterMarker itemCount={cluster.properties.point_count} />,
    []
  );

  const renderPointIconFn = useMemo(
    () => () => <MapPinIcon size="M" variant="primary" />,
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

  const mapRegion = getInteractionsMapRegion({
    interaction: interactions[0],
    deltaSize: 'M',
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
      onAppleMapReady={() => {
        // need to run onReady for initial render on Apple Maps
        onRegionChangeComplete(mapRegion);
      }}
    >
      <MapClusters
        mapRef={mapRef}
        clusters={clusters}
        clusterRenderer={renderClusterIconFn}
        pointRenderer={renderPointIconFn}
        onClusterPress={(c) => zoomToCluster(c, mapRef)}
        onPointPress={(p) => console.log(p)}
      />
    </MapViewport>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
