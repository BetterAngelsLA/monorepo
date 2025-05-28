import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  LoadingView,
  MapView,
  coordsToRegion,
  regionDeltaMap,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';
import { useGetClientInteractionsWithLocation } from '../../../hooks/interactions/useGetClientInteractionsWithLocation';
import { Marker } from '../../../maps';
import { EmptyState } from './EmptyState';

type TProps = {
  clientProfileId: string;
};

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId } = props;

  const { interactions: interactionsWithLocation, loading } =
    useGetClientInteractionsWithLocation(clientProfileId);

  if (loading) {
    return <LoadingView />;
  }

  // unless loading, render nothing until interactions are defined
  if (!loading && interactionsWithLocation === undefined) {
    return null;
  }

  if (!interactionsWithLocation?.length) {
    return <EmptyState />;
  }

  const mostRecentInteraction = interactionsWithLocation.reduce(
    (latest, current) =>
      new Date(current.interactedAt) > new Date(latest.interactedAt)
        ? current
        : latest
  );

  const mostRecentPoint = mostRecentInteraction.location?.point;

  if (!mostRecentPoint) {
    return <EmptyState />;
  }

  const [longitude, latitude] = mostRecentPoint;

  const mapRegion = coordsToRegion({
    latitude,
    longitude,
    ...regionDeltaMap.M,
  });

  return (
    <MapView
      enableUserLocation={true}
      style={styles.map}
      provider="google"
      initialRegion={mapRegion}
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
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 650,
  },
});
