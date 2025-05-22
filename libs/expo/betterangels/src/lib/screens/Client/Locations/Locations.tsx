import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { MapView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';
import { useUserLocation } from './useUserLocation';
import { Marker } from '../../../maps';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { useGetInteractionsLocation } from './useGetInteractionsLocation';

export function Locations({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }
  const userLocation = useUserLocation();
  const interactionsLocation = useGetInteractionsLocation(
    client.clientProfile.id
  );

  return (
    <MapView showsUserLocation={userLocation ? true : false} style={styles.map}>
      {interactionsLocation?.map(({ longitude, latitude }, index) => (
        <Marker
          tracksViewChanges={false}
          key={index}
          coordinate={{
            longitude,
            latitude,
          }}
        >
          <LocationPinIcon size="2xl" />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 650,
  },
});
