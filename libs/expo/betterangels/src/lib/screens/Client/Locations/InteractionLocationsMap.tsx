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
import { EmptyState } from './EmptyState';

type TProps = {
  clientProfileId: string;
};

export function InteractionLocationsMap(props: TProps) {
  const { clientProfileId } = props;

  const { interactions, loading } =
    useGetClientInteractionsWithLocation(clientProfileId);

  if (loading) {
    console.log('################################### map: loading');
    return <LoadingView />;
  }

  // unless loading, render nothing until interactions are defined
  //   if (!loading && interactions === undefined) {
  //     console.log('################################### map: RETURN NULL');
  //     return null;
  //   }

  if (!interactions?.length) {
    console.log('################################### map: empty');
    return <EmptyState />;
  }

  const mostRecentInteraction = interactions.reduce((latest, current) =>
    new Date(current.interactedAt) > new Date(latest.interactedAt)
      ? current
      : latest
  );

  const mostRecentPoint = mostRecentInteraction.location?.point;

  console.log('*****************  mostRecentPoint:', !!mostRecentPoint);

  let initialRegion: Region | undefined = undefined;

  if (mostRecentPoint) {
    const [longitude, latitude] = mostRecentPoint;

    initialRegion = coordsToRegion({ latitude, longitude });
  }

  console.log('###################### map: RENDER MAP: ', interactions.length);

  return (
    <MapView
      enableUserLocation={true}
      style={styles.map}
      //   provider="google"
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
    borderWidth: 4,
    borderColor: 'red',
  },
});
