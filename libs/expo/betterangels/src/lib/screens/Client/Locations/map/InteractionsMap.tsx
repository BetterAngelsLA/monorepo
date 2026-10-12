import {
  IMapClusterManager,
  LoadingView,
  LocationMarker,
  MapClusterMarker,
  MapClusters,
  MapViewport,
  TClusterPoint,
  TMapView,
  panMap,
  regionDeltaMap,
  useClusters,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { useSnackbar } from '../../../../hooks';
import { useClientInteractionsMapState } from '../../../../state';
import { EmptyState } from '../EmptyState';
import { useInteractionPointFeatures } from './hooks/useInteractionPointFeatures';
import { useInteractionsMapRegion } from './hooks/useInteractionsMapRegion';
import { TClusterInteraction } from './types';

const interactionsClusterOptions: IMapClusterManager = {
  radius: 50,
  edgePadding: [
    { max: 4, padding: { top: 80, bottom: 80, left: 100, right: 100 } },
    {
      max: Infinity,
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
    },
  ],
  map: (feature) => ({
    mostRecent: feature['mostRecent'],
  }),
  reduce: (acc, props) => {
    acc['mostRecent'] = acc['mostRecent'] || props['mostRecent'];
  },
};

type TProps = {
  clientProfileId: string;
};

export function InteractionsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { showSnackbar } = useSnackbar();
  const [_mapState, setMapState] = useClientInteractionsMapState();

  // 1. Pull data
  const { pointFeatures, loading, error, interactions } =
    useInteractionPointFeatures(clientProfileId);

  // 2. Derive clusters
  const {
    clusters,
    updateClustersForRegion,
    zoomToCluster,
    canExpandFurther,
    getClusterLeaves,
  } = useClusters<TClusterInteraction>({
    pointFeatures,
    opts: interactionsClusterOptions,
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
    () => (cluster: TClusterPoint) => (
      <MapClusterMarker
        label={cluster.properties['mostRecent'] ? 'Last Seen' : undefined}
        itemCount={cluster.properties.point_count}
      />
    ),

    [],
  );

  const renderPointWithLabel = useCallback(
    (point: { properties: { mostRecent: boolean } }) => (
      <LocationMarker
        label={point.properties.mostRecent ? 'Last Seen' : undefined}
      />
    ),
    [],
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

  async function onClusterPress(cluster: TClusterPoint) {
    const { maxZoomLeaves } = cluster.properties;

    // Ask the map where it is, rather than `mapState.region`: that is only filled
    // by `onRegionChangeComplete`, and web does not fire it for a programmatic fit,
    // so it can be absent or stale by the time a cluster is clicked.
    const camera = await mapRef.current?.getCamera?.();

    // Zooming is how you drill into a cluster, but it cannot separate one whose
    // points are already on screen — the map would not move and no card would
    // appear, which reads as a dead click. So zoom only while it buys
    // separation, and otherwise show what is inside.
    if (canExpandFurther(cluster, camera?.zoom)) {
      void zoomToCluster(cluster, mapRef);

      setMapState((prev) => ({
        ...prev,
        selectedInteractions: [],
      }));

      return;
    }

    // Either it is already too dense to break up (`maxZoomLeaves`) or this click
    // could not split it further; both mean "show the points it holds".
    const leaves = maxZoomLeaves?.length
      ? maxZoomLeaves
      : getClusterLeaves(cluster);

    const selectedIntIds: string[] = leaves.map((leaf) =>
      String(leaf.properties.id),
    );

    const selectedInteractions =
      interactions?.filter((i) => selectedIntIds.includes(i.id)) || [];

    setMapState((prev) => ({
      ...prev,
      selectedInteractions,
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
        pointRenderer={renderPointWithLabel}
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
