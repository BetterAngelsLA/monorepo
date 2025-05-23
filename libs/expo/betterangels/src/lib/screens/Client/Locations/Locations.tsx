import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { LoadingView, MapView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';
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

  return (
    <MapView enableUserLocation={true} style={styles.map}>
      {interactions.map((interaction) => {
        const { id, location } = interaction;
        const { latitude, longitude } = location!.point;

        return (
          <Marker
            key={id}
            tracksViewChanges={false}
            coordinate={{
              longitude,
              latitude,
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
