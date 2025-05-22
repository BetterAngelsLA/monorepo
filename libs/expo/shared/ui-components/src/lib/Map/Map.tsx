import { useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Region } from 'react-native-maps';
import { defaultMapRegion } from './constants';
import { RNMapView, TRNMapView } from './mapLib';

type TMapProps = {
  provider?: 'google';
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
  showsUserLocation?: boolean;
  ref: React.Ref<TRNMapView>;
};

export function MapView(props: TMapProps) {
  const {
    provider: mapPovider = 'google',
    initialRegion,
    style,
    showsUserLocation,
    ref,
  } = props;

  const [_mapReady, setMapReady] = useState(false);

  return (
    <RNMapView
      showsUserLocation={showsUserLocation}
      ref={ref}
      provider={mapPovider}
      showsMyLocationButton={false}
      zoomEnabled
      scrollEnabled
      zoomControlEnabled
      mapType="standard"
      initialRegion={initialRegion || defaultMapRegion}
      onMapReady={() => setMapReady(true)}
      style={[styles.map, style]}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
