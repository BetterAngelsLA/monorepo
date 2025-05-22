import { MapView } from '@monorepo/expo/shared/ui-components';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { TMapView } from '../../../maps';
import { useUserLocation } from './useUserLocation';

export function Locations() {
  const userLocation = useUserLocation();
  const mapRef = useRef<TMapView>(null);

  return (
    <MapView ref={mapRef} userLocation={userLocation} style={styles.map} />
  );
}

const styles = StyleSheet.create({
  map: {
    height: 650,
  },
});
