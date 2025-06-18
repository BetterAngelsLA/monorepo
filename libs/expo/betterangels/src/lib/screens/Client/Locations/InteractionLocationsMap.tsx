import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  coordsToRegion,
  defaultMapRegion,
  LoadingView,
  MapView,
  regionDeltaMap,
} from '@monorepo/expo/shared/ui-components';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { NotesQuery, Ordering } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useGetClientInteractionsWithLocation } from '../../../hooks/interactions/useGetClientInteractionsWithLocation';
import { Marker, TMapView } from '../../../maps';
import { EmptyState } from './EmptyState';

type TProps = {
  clientProfileId: string;
  setSelectedLocation?: (
    interaction: NotesQuery['notes']['results'][number]
  ) => void;
};

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId, setSelectedLocation } = props;

  const { showSnackbar } = useSnackbar();
  const {
    interactions: interactionsWithLocation,
    loading,
    error,
  } = useGetClientInteractionsWithLocation({
    id: clientProfileId,
    dateSort: Ordering.Desc,
  });

  const mapRef = useRef<TMapView>(null);

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

  function onMarkerPress(interaction: NotesQuery['notes']['results'][number]) {
    if (interaction && setSelectedLocation) {
      setSelectedLocation(interaction);
      const region = getMapRegion(interaction);
      if (region && mapRef.current) {
        mapRef.current.animateToRegion(region, 500);
      }
    }
  }

  return (
    <MapView
      ref={mapRef}
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
            onPress={() => onMarkerPress(interaction)}
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
    </MapView>
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
