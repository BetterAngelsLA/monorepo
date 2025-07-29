import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  IMapClusterManager,
  LoadingView,
  MapClusterMarker,
  MapClusters,
  MapViewport,
  TClusterPoint,
  TMapView,
  panMap,
  regionDeltaMap,
  useClusters,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useRef } from 'react';
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
  const { clusters, updateClustersForRegion, zoomToCluster } =
    useClusters<TClusterInteraction>({
      pointFeatures,
      opts: interactionsClusterOptions,
    });

  const mapRegion = useInteractionsMapRegion({
    interaction: interactions?.[0],
    delta: regionDeltaMap.M,
  });

  function onRegionChangeComplete(region: Region) {
    updateClustersForRegion(region);

    // New Architecture Upgrade Notes:

    // expo SDK 53 is bundled with react-native-maps 1.20.1 which is from 11/24
    //  and missing a lot of enhancements that are probably necessary.

    // with new architecture (Fabric) there are couple issues:
    // 1. Maps do not render on Android
    // 2. Fabric and TurboModules Compatibility:
    // 2.1 Recent React Native updates, particularly those introducing Fabric and TurboModules,
    //  have caused compatibility issues with react-native-maps. These changes can affect how
    //  native modules, including the map view, are linked and initialized, potentially leading
    //  to initialRegion being ignored or behaving inconsistently across platforms
    //  (e.g., working on iOS but not Android, or vice-versa).
    // 2.2 using state, like below may require switching to a controlled map and
    //  using the `region` prop instead of `initialRegion`.
    // 2.3 Alternative is to wait and see what the new Expo lib offers, whenever that comes out.
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

    // zoom in
    zoomToCluster(cluster, mapRef);

    if (!maxZoomLeaves?.length) {
      // clicked on cluster that will zoom in, so reset selected Interaction
      setMapState((prev) => ({
        ...prev,
        selectedInteractions: [],
      }));

      return;
    }

    // maxZoomLeaves means we cannot break down cluster any further
    // so set mapState maxZoomLeaves as selectedInteractions
    const selectedIntIds: string[] = maxZoomLeaves.map((leaf) =>
      String(leaf.properties.id)
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
