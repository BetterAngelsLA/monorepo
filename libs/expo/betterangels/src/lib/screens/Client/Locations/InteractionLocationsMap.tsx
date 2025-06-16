import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  LoadingView,
  MapViewport,
  coordsToRegion,
  defaultMapRegion,
  regionDeltaMap,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { NotesQuery, Ordering } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useGetClientInteractionsWithLocation } from '../../../hooks/interactions/useGetClientInteractionsWithLocation';
import { Marker } from '../../../maps';
import { EmptyState } from './EmptyState';

type TProps = {
  clientProfileId: string;
};

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId } = props;

  const { showSnackbar } = useSnackbar();
  const {
    interactions: interactionsWithLocation,
    loading,
    error,
  } = useGetClientInteractionsWithLocation({
    id: clientProfileId,
    dateSort: Ordering.Desc,
  });

  if (error) {
    showSnackbar({
      message: 'Sorry, we could not load the interactions. Please try again.',
      type: 'error',
    });

    return null;
  }

  if (loading) {
    return <LoadingView />;
  }

  // unless loading, render nothing until interactions are defined
  if (interactionsWithLocation === undefined) {
    return null;
  }

  if (!interactionsWithLocation?.length) {
    return <EmptyState />;
  }

  const mapRegion = getMapRegion(interactionsWithLocation[0]);

  return (
    <MapViewport
      enableUserLocation={true}
      style={styles.map}
      provider="google"
      initialRegion={mapRegion || defaultMapRegion}
    >
      {interactionsWithLocation.map((interaction) => {
        const { id, location } = interaction;
        const [longitude, latitude] = location!.point;

        return (
          <Marker
            key={id}
            tracksViewChanges={false}
            coordinate={{
              latitude,
              longitude,
            }}
          >
            <LocationPinIcon size="2xl" />
          </Marker>
        );
      })}
    </MapViewport>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

type TInteraction = NonNullable<
  NonNullable<NotesQuery['notes']>['results']
>[number];

function getMapRegion(interaction: TInteraction): Region | null {
  const point = interaction.location?.point;

  if (!point) {
    return null;
  }

  const [longitude, latitude] = point;

  return coordsToRegion({
    latitude,
    longitude,
    ...regionDeltaMap.L,
  });
}
