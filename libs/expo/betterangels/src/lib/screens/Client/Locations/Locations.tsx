import { MapView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';
import { useUserLocation } from './useUserLocation';

export function Locations() {
  const userLocation = useUserLocation();

  return (
    <MapView
      showsUserLocation={userLocation ? true : false}
      style={styles.map}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    height: 650,
  },
});
