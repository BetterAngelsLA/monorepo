import { useRef, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Region } from 'react-native-maps';
import { defaultMapRegion } from './constants';
import { RNMapView, TRNMapView } from './mapLib';

type TMapProps = {
  provider?: 'google';
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
};

export function MapView(props: TMapProps) {
  const { provider: mapPovider = 'google', initialRegion, style } = props;

  const mapRef = useRef<TRNMapView | null>(null);
  const [_mapReady, setMapReady] = useState(false);

  return (
    <RNMapView
      ref={mapRef}
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
