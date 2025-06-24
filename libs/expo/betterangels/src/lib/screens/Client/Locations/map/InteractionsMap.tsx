import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  LoadingView,
  MapClusterMarker,
  MapClusters,
  MapViewport,
  TClusterPoint,
  TMapView,
  panMap,
  regionDeltaMap,
  regionToZoom,
  useClusters,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { useSnackbar } from '../../../../hooks';
import { EmptyState } from '../EmptyState';
import { useInteractionsMapState } from './InteractionsMapStateContext';
import { useInteractionPointFeatures } from './hooks/useInteractionPointFeatures';
import { useInteractionsMapRegion } from './hooks/useInteractionsMapRegion';
import { TClusterInteraction } from './types';

type TProps = {
  clientProfileId: string;
};

export function InteractionsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const {
    state: mapState,
    setState: setMapState,
    setMapDimensions,
  } = useInteractionsMapState();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const { region, dimensions } = mapState;

    if (!region || !dimensions) {
      return;
    }

    const zoom = regionToZoom(region, dimensions.width);

    const zoom2 = Math.round(zoom * 100) / 100;

    console.log('*****************  NEW zoom:', zoom2);
  }, [mapState]);

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

    // use array to allow rendering multiple cards
    const selected = interaction ? [interaction] : [];

    setMapState((prev) => ({
      ...prev,
      selectedInteractions: selected,
    }));

    const centerPoint = selected[0].location?.point;

    if (!centerPoint) {
      return;
    }

    panMap({
      mapRef,
      center: {
        longitude: centerPoint[0],
        latitude: centerPoint[1],
      },
    });
  }

  function onClusterPress(cluster: TClusterPoint) {
    const { maxZoomLeaves } = cluster.properties;

    if (maxZoomLeaves?.length) {
      const selectedIntIds: string[] = maxZoomLeaves.map((l: any) =>
        String(l.properties.id)
      );

      const selectedInteractions =
        interactions?.filter((i) => selectedIntIds.includes(i.id)) || [];

      setMapState((prev) => ({
        ...prev,
        selectedInteractions,
      }));
    }

    zoomToCluster(cluster, mapRef);
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
      onMeasured={setMapDimensions}
    >
      <MapClusters
        mapRef={mapRef}
        clusters={clusters}
        clusterRenderer={renderClusterIconFn}
        pointRenderer={renderPointIconFn}
        onClusterPress={onClusterPress}
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
