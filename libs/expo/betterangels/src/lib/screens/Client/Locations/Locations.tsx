import { MapView, TextButton } from '@monorepo/expo/shared/ui-components';
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
      {/* TODO: replacd with LocateMeButton */}
      <TextButton
        onPress={goToUserLocation}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 200,
          backgroundColor: 'red',
        }}
        title={'PRESS'}
        accessibilityHint={'PRESS'}
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
});
