import { ReactNode, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { defaultMapRegion } from './constants';
import { MapLocateMeBtn } from './mapUi/MapLocateMeBtn';
import { TMapView } from './types';

type TMapProps = {
  provider?: 'google';
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
  mapStyle?: StyleProp<ViewStyle>;
  enableUserLocation?: boolean;
  children?: ReactNode;
};

// Not named `Map` as it clashes with JS Map constructor
export function MapViewport(props: TMapProps) {
  const {
    provider,
    initialRegion,
    style,
    mapStyle,
    enableUserLocation,
    children,
  } = props;

  const [_mapReady, setMapReady] = useState(false);
  const mapRef = useRef<TMapView>(null);

  return (
    <View style={[styles.wrapper, style]}>
      <MapView
        ref={mapRef}
        provider={provider}
        showsUserLocation={!!enableUserLocation}
        showsMyLocationButton={false}
        zoomEnabled
        scrollEnabled
        zoomControlEnabled={false}
        mapType="standard"
        initialRegion={initialRegion || defaultMapRegion}
        onMapReady={() => setMapReady(true)}
        style={[styles.map, mapStyle]}
      >
        {children}
      </MapView>

      {!!enableUserLocation && <MapLocateMeBtn mapRef={mapRef} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
});
