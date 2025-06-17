import { ReactNode, RefObject, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { Details, Region } from 'react-native-maps';
import { defaultMapRegion } from './constants';
import { MapLocateMeBtn } from './mapUi/MapLocateMeBtn';
import { TMapView } from './types';

type TMapProps = {
  mapRef: RefObject<TMapView | null>;
  provider?: 'google';
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
  mapStyle?: StyleProp<ViewStyle>;
  enableUserLocation?: boolean;
  children?: ReactNode;
  onRegionChangeComplete?: (region: Region, details: Details) => void;
};

export function MapViewport(props: TMapProps) {
  const {
    mapRef,
    provider,
    initialRegion,
    onRegionChangeComplete,
    style,
    mapStyle,
    enableUserLocation,
    children,
  } = props;

  const [_mapReady, setMapReady] = useState(false);

  if (!mapRef) {
    return null;
  }

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
        onRegionChangeComplete={onRegionChangeComplete}
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
