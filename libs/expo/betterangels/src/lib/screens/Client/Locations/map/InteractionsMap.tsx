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
import isEqual from 'react-fast-compare';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { NotesQuery } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import { useClientMapState } from '../../ClientTabs';
import { EmptyState } from '../EmptyState';
import { TClusterInteraction } from './types';
import { useInteractionPointFeatures } from './useInteractionPointFeatures';
import { useInteractionsMapRegion } from './useInteractionsMapRegion';

type TProps = {
  clientProfileId: string;
  setSelectedLocation?: (
    interaction: NotesQuery['notes']['results'][number]
  ) => void;
};

export function InteractionsMap(props: TProps) {
  const { clientProfileId, setSelectedLocation } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { mapState, setMapState } = useClientMapState(clientProfileId);

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
    clientProfileId,
    interaction: interactions?.[0],
    deltaSize: 'M',
  });

  // from 'react-fast-compare';
  console.log();
  console.log('| -------------  COMPARE  ------------- |');
  console.log('*****************  mapRegion:', mapRegion);
  console.log();
  console.log('*****************  mapState?.region:', mapState?.region);
  console.log();
  const same = isEqual(mapRegion, mapState?.region);

  console.log('*****************  isEqual:', same);

  function onRegionChangeComplete(region: Region) {
    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    const hello = `${minutes}:${seconds}:${milliseconds}`;

    console.log('');
    console.log('------------------------------------------------------------');
    console.log(`--------------------------------------------------  ${hello}`);
    console.log('------------------------------------------------------------');
    console.log('');
    console.log('*****************  onRegionChangeComplete:', region);
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

  async function onMarkerPress(interactionId: string) {
    const interaction = interactions?.find((i) => i.id === interactionId);
    if (interaction && setSelectedLocation) {
      setSelectedLocation(interaction);

      const point = interaction.location?.point;

      if (!point || !mapRef.current) {
        return;
      }

      const currentCamera = await mapRef.current.getCamera();

      mapRef.current.animateCamera(
        {
          ...currentCamera,
          center: {
            latitude: point[1],
            longitude: point[0],
          },
        },
        { duration: 500 }
      );
    }
  }

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
