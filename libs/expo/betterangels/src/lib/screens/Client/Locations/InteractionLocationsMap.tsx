import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  ClusterMap,
  LoadingView,
  MapClusterManager,
  MapClusterMarker,
  RegionDeltaSize,
  defaultMapRegion,
  regionDeltaMap,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import type { PointFeature } from 'supercluster';
import { Ordering } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useGetClientInteractionsWithLocation } from '../../../hooks/interactions/useGetClientInteractionsWithLocation';
import { Marker, TMapView } from '../../../maps';
import { EmptyState } from './EmptyState';
import { getMapRegion } from './utils/getMapRegion';

const MAP_DELTA_SIZE: RegionDeltaSize = '2XL';

type TProps = {
  clientProfileId: string;
};

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { showSnackbar } = useSnackbar();
  const [clusters, setClusters] = useState<Array<any>>([]);

  // 1. Fetch interactions…
  const {
    interactions: interactionsWithLocation,
    loading,
    error,
  } = useGetClientInteractionsWithLocation({
    id: clientProfileId,
    dateSort: Ordering.Desc,
  });

  // 2. Turn them into GeoJSON Features
  const pointFeatures = useMemo<PointFeature<{ id: string }>[]>(() => {
    if (!interactionsWithLocation) {
      return [];
    }

    return interactionsWithLocation.map((i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: i.location!.point },
      properties: { id: i.id },
    }));
  }, [interactionsWithLocation]);

  // 3. Create & load your cluster manager once
  const clusterManager = useMemo(() => {
    const mgr = new MapClusterManager<{ id: string }>();
    mgr.load(pointFeatures);

    return mgr;
  }, [pointFeatures]);

  // Utility to convert Region → bbox
  const regionToBbox = (r: Region): [number, number, number, number] => [
    r.longitude - r.longitudeDelta / 2,
    r.latitude - r.latitudeDelta / 2,
    r.longitude + r.longitudeDelta / 2,
    r.latitude + r.latitudeDelta / 2,
  ];

  // Rough conversion of latitudeDelta → zoom
  // (supercluster zoom ~ worldWidth / lonDelta = 2^zoom)
  const regionToZoom = (r: Region) =>
    Math.round(Math.log2(360 / r.longitudeDelta));

  const onRegionChangeComplete = useCallback(
    (r: Region) => {
      const bbox = regionToBbox(r);
      const zoom = regionToZoom(r);
      const next = clusterManager.getClusters(bbox, zoom);

      setClusters(next);
    },
    [clusterManager]
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

  const mapRegion = getMapRegion({
    interaction: interactionsWithLocation[0],
    deltaSize: MAP_DELTA_SIZE,
  });

  const initialRegion = mapRegion || {
    ...defaultMapRegion,
    ...regionDeltaMap[MAP_DELTA_SIZE],
  };

  return (
    <ClusterMap
      mapRef={mapRef}
      // enableUserLocation={true}
      style={styles.map}
      provider="google"
      initialRegion={initialRegion}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {clusters.map((feat) => {
        if (feat.properties.cluster) {
          const { cluster_id, point_count } = feat.properties;
          const [longitude, latitude] = feat.geometry.coordinates;

          return (
            <Marker
              key={`cluster-${cluster_id}`}
              tracksViewChanges={false}
              coordinate={{ latitude, longitude }}
              onPress={() => {
                clusterManager.zoomToCluster(cluster_id, mapRef);
              }}
            >
              <MapClusterMarker text={point_count} />
            </Marker>
          );
        } else {
          const { id } = feat.properties;

          const [longitude, latitude] = feat.geometry.coordinates;
          return (
            <Marker
              key={`point-${id}`}
              coordinate={{ latitude, longitude }}
              tracksViewChanges={false}
            >
              <LocationPinIcon size="2xl" />
            </Marker>
          );
        }
      })}
    </ClusterMap>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
