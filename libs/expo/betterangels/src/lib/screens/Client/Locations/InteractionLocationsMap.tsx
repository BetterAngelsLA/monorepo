import { MapPinIcon } from '@monorepo/expo/shared/icons';
import {
  ClusterMap,
  ClusterOrPoint,
  LoadingView,
  MapClusterMarker,
  RegionDeltaSize,
  regionToBbox,
  regionToZoom,
  useMapClusterManager,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  // 5 · Trim the payload stored in properties
  // Right now each point’s properties equals the full interaction object
  // (~10-15 keys). Supercluster only needs id and maybe a couple of display
  // fields. Smaller objects ⇒ less JSON cloning and less memory churn:
  //   If you still need the full interaction later, stash a lookup map outside the
  // cluster manager (interactionById[id] = interaction).
  const pointFeatures = useMemo<PointFeature<TNotesQueryInteraction>[]>(() => {
    if (!interactionsWithLocation) {
      return [];
    }

    // console.log(
    //   '| -------------  interactionsWithLocation[0]  ------------- |'
    // );
    // console.log(interactionsWithLocation[0]);
    // console.log();

    return interactionsWithLocation.map((i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: i.location!.point },
      properties: i,
    }));
  }, [interactionsWithLocation]);

  // const clusterManager = useMemo(
  //   () => new MapClusterManager<TNotesQueryInteraction>(),
  //   []
  // );

  const clusterManager = useMapClusterManager<TNotesQueryInteraction>();

  useEffect(() => {
    if (!pointFeatures) {
      return;
    }

    console.log('############## LOAD POINT FEATURES');
    clusterManager.load(pointFeatures);
  }, [interactionsWithLocation]);
  // }, [pointFeatures]);
  // }, [clusterManager, pointFeatures]);
  // interactionsWithLocation

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      console.log('################## onRegionChangeComplete');
      const bbox = regionToBbox(region);
      const zoom = regionToZoom(region);
      const next = clusterManager.getClusters(bbox, zoom);

      setClusters(next);
    },
    [clusterManager, regionToBbox, regionToZoom]
  );

  // 2 Throttle onRegionChangeComplete
  // 3 · Skip setClusters when nothing really changed
  // Even throttled, you can avoid needless re-renders by checking identity:
  // inside the throttled fn
  // if (!arraysEqual(clustersRef.current, next)) {
  //   clustersRef.current = next;
  //   setClusters(next);
  // }
  //   Keep clustersRef with useRef so you can compare without triggering
  // renders.

  // const onRegionChangeComplete = useCallback(
  //   throttle((region: Region) => {
  //     const bbox  = regionToBbox(region);
  //     const zoom  = regionToZoom(region);
  //     const next  = clusterManager.getClusters(bbox, zoom);

  //     setClusters(next);
  //   }, 120),
  //   [clusterManager]           // helpers are imported ⇒ stable
  // );

  // const onRegionChangeComplete = (newRegion: Region) => {
  //   setZoom(getZoomFromRegion(newRegion))
  //   setRegion(newRegion)
  // }

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

// const hello = {
//   __typename: 'NoteType',
//   clientProfile: {
//     __typename: 'ClientProfileType',
//     displayCaseManager: 'Not Assigned',
//     email: 'tom@betterangels.la',
//     firstName: 'Dupe',
//     id: '2',
//     lastName: 'Cal ID',
//     profilePhoto: null,
//     user: {
//       __typename: 'UserType',
//       id: '6',
//       username: '9d2e12a6-76c4-44a6-971f-ffe88f344c69',
//     },
//   },
//   createdBy: {
//     __typename: 'UserType',
//     email: 'admin@example.com',
//     firstName: null,
//     id: '1',
//     lastName: null,
//     username: 'admin',
//   },
//   id: '151',
//   interactedAt: '2025-06-13T05:42:14.164557+00:00',
//   isSubmitted: true,
//   location: {
//     __typename: 'LocationType',
//     address: {
//       __typename: 'AddressType',
//       city: 'Los Angeles',
//       id: '33',
//       state: 'CA',
//       street: '700 West 7th Street',
//       zipCode: '90017',
//     },
//     point: [-11825900316238403, 34.047596933230366],
//     pointOfInterest: null,
//   },
//   moods: [],
//   organization: { __typename: 'OrganizationType', id: '1', name: 'test_org' },
//   providedServices: [],
//   publicDetails: '',
//   purpose: null,
//   requestedServices: [],
//   team: null,
// };
