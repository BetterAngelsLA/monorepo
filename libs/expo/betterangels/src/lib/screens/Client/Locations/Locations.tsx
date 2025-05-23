import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  LoadingView,
  MapView,
  coordsToRegion,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { useGetClientInteractionsWithLocation } from '../../../hooks/interactions/useGetClientInteractionsWithLocation';
import { Marker } from '../../../maps';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { EmptyState } from './EmptyState';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function Locations(props: TProps) {
  const { client } = props;

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }

  const { interactions, loading } = useGetClientInteractionsWithLocation(
    client.clientProfile.id
  );

  if (loading) {
    return <LoadingView />;
  }

  if (!interactions?.length) {
    return <EmptyState />;
  }

  const mostRecentInteraction = interactions.reduce((latest, current) =>
    new Date(current.interactedAt) > new Date(latest.interactedAt)
      ? current
      : latest
  );

  const mostRecentPoint = mostRecentInteraction.location?.point;

  let initialRegion: Region | undefined = undefined;

  if (mostRecentPoint) {
    const [longitude, latitude] = mostRecentPoint;

    initialRegion = coordsToRegion({ latitude, longitude });
  }

  return (
    <MapView
      enableUserLocation={true}
      style={styles.map}
      initialRegion={initialRegion}
    >
      {interactions.map((interaction) => {
        const { id, location } = interaction;
        const point = location?.point;

        if (!point) {
          return null;
        }

        const [longitude, latitude] = point;

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
