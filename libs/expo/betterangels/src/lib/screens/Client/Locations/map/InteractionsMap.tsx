import { LocationPinIcon } from '@monorepo/expo/shared/icons';
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
        edgePadding: [
          { max: 4, padding: { top: 80, bottom: 80, left: 100, right: 100 } },
          {
            max: Infinity,
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
          },
        ],
      },
    });

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
      onMapReady={() => {
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
