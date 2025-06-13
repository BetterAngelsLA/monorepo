import { LocationPinIcon } from '@monorepo/expo/shared/icons';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import type { PointFeature } from 'supercluster';
import { Ordering, TNotesQueryInteraction } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useGetClientInteractionsWithLocation } from '../../../hooks/interactions/useGetClientInteractionsWithLocation';
import { TMapView } from '../../../maps';
import { EmptyState } from './EmptyState';
import { InteractionClusters } from './InteractionClusters';
import { getInteractionsMapRegion } from './utils/getInteractionsMapRegion';

const MAP_DELTA_SIZE: RegionDeltaSize = '2XL';

type TProps = {
  clientProfileId: string;
};

// TNotesQueryInteraction

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId } = props;

  const mapRef = useRef<TMapView | null>(null);
  const { showSnackbar } = useSnackbar();
  const [clusters, setClusters] = useState<
    undefined | ClusterOrPoint<TNotesQueryInteraction>[]
  >(undefined);
  const [mapRegion, setMapRegion] = useState<Region | null | undefined>(
    undefined
  );

  // 1. Fetch interactions…
  const {
    interactions: interactionsWithLocation,
    loading,
    error,
  } = useGetClientInteractionsWithLocation({
    id: clientProfileId,
    dateSort: Ordering.Desc,
  });

  // set mapRegion
  useEffect(() => {
    // undefined mapRegion: component is mounting
    if (interactionsWithLocation === undefined) {
      return;
    }

    // null mapRegion: no interactions exist
    if (!interactionsWithLocation.length) {
      setMapRegion(null);

      return;
    }

    const newRegion = getInteractionsMapRegion({
      interaction: interactionsWithLocation[0],
      deltaSize: MAP_DELTA_SIZE,
    });

    setMapRegion(newRegion);
  }, [interactionsWithLocation]);

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

  // 3. Create & load your cluster manager once
  const clusterManager = useMemo(() => {
    const mgr = new MapClusterManager<TNotesQueryInteraction>();
    mgr.load(pointFeatures);

    return mgr;
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

  useEffect(() => {
    if (mapRegion) {
      onRegionChangeComplete(mapRegion);
    }
  }, [mapRegion, onRegionChangeComplete]);

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
  if (mapRegion === undefined) {
    return null;
  }

  if (!mapRegion) {
    return <EmptyState />;
  }

  if (!clusters?.length) {
    return null;
  }

  return (
    <ClusterMap
      mapRef={mapRef}
      // enableUserLocation={true}
      style={styles.map}
      provider="google"
      initialRegion={mapRegion}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      <InteractionClusters
        clusterManager={clusterManager}
        mapRef={mapRef}
        clusters={clusters}
        clusterRenderer={(cluster) => {
          return (
            <MapClusterMarker itemCount={cluster.properties.point_count} />
          );
        }}
        pointRenderer={() => {
          return <LocationPinIcon size="2xl" />;
        }}
      />
      {/* <InteractionClusters /> */}

      {/* {clusters.map((feat) => {
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
              <MapClusterMarker itemCount={point_count} />
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
      })} */}
    </ClusterMap>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
