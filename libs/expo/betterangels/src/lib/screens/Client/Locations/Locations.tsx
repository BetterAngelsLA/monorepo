import { LocateMeButton, MapView } from '@monorepo/expo/shared/ui-components';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { TMapView } from '../../../maps';
import { useUserLocation } from './useUserLocation';

export function Locations() {
  const userLocation = useUserLocation();
  const mapRef = useRef<TMapView>(null);

  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  return (
    <View>
      <MapView
        ref={mapRef}
        showsUserLocation={userLocation ? true : false}
        style={styles.map}
      />
      <LocateMeButton
        style={styles.locateMeButton}
        onPress={goToUserLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    height: 650,
  },
  locateMeButton: {
    position: 'absolute',
    right: 16,
    bottom: '25%',
  },
});
