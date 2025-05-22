import * as Location from 'expo-location';
import { forwardRef, useState } from 'react';
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
};

export const MapView = forwardRef<TRNMapView, TMapProps>(
  (props: TMapProps, ref) => {
    const {
      provider: mapPovider = 'google',
      initialRegion,
      style,
      userLocation,
    } = props;

    const [_mapReady, setMapReady] = useState(false);

    const goToUserLocation = () => {
      if (userLocation && ref && 'current' in ref && ref.current) {
        ref.current.animateToRegion(
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
          ref={ref}
          provider={mapPovider}
          showsMyLocationButton={false}
          zoomEnabled
          scrollEnabled
          zoomControlEnabled={false}
          mapType="standard"
          initialRegion={initialRegion || defaultMapRegion}
          onMapReady={() => setMapReady(true)}
          style={[styles.map, style]}
        />

        <LocateMeButton
          style={styles.locateMeButton}
          onPress={goToUserLocation}
        />
      </View>
    );
  }
);

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
