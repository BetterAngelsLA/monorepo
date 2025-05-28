import { ReactNode, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Region } from 'react-native-maps';
import { defaultMapRegion } from './constants';
import { RNMapView, TRNMapView } from './mapLib';
import { MapLocateMeBtn } from './mapUi/MapLocateMeBtn';

type TMapProps = {
  provider?: 'google';
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
  mapStyle?: StyleProp<ViewStyle>;
  enableUserLocation?: boolean;
  children?: ReactNode;
};

export function MapView(props: TMapProps) {
  const {
    provider,
    initialRegion,
    style,
    mapStyle,
    enableUserLocation,
    children,
  } = props;

  const [_mapReady, setMapReady] = useState(false);
  const mapRef = useRef<TRNMapView>(null);

  return (
    <View style={[styles.wrapper, style]}>
      <RNMapView
        ref={mapRef}
        provider={provider}
        // showsUserLocation={true}
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
      </RNMapView>

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
