import * as Location from 'expo-location';
import { ReactNode, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Region } from 'react-native-maps';
import LocateMeButton from '../LocateMeButton';
import { defaultMapRegion } from './constants';
import { RNMapView, TRNMapView } from './mapLib';

type TMapProps = {
  provider?: 'google';
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
  userLocation?: Location.LocationObject | null;
  children?: ReactNode;
};

export function MapView(props: TMapProps) {
  const {
    provider: mapPovider = 'google',
    initialRegion,
    style,
    userLocation,
    children,
  } = props;

  const [_mapReady, setMapReady] = useState(false);
  const mapRef = useRef<TRNMapView>(null);

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
    <View style={styles.wrapper}>
      <RNMapView
        showsUserLocation={userLocation ? true : false}
        ref={mapRef}
        provider={mapPovider}
        showsMyLocationButton={false}
        zoomEnabled
        scrollEnabled
        zoomControlEnabled={false}
        mapType="standard"
        initialRegion={initialRegion || defaultMapRegion}
        onMapReady={() => setMapReady(true)}
        style={[styles.map, style]}
      >
        {children}
      </RNMapView>
      <LocateMeButton
        style={styles.locateMeButton}
        onPress={goToUserLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  locateMeButton: {
    position: 'absolute',
    right: 16,
    bottom: '15%',
    zIndex: 10,
  },
});
