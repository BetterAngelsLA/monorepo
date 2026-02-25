import { ReactNode, RefObject, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { Details, Region } from 'react-native-maps';
import { defaultMapRegion } from './constants';
import { MapLocateMeBtn } from './MapLocateMeBtn';
import { TMapView } from './types';

type TMapProps = {
  ref: RefObject<TMapView | null>;
  provider?: 'google';
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
  mapStyle?: StyleProp<ViewStyle>;
  enableUserLocation?: boolean;
  children?: ReactNode;
  onRegionChangeComplete?: (region: Region, details: Details) => void;
  onMapReady?: () => void;
  onAppleMapReady?: () => void;
  onGoogleMapReady?: () => void;
};

export function MapViewport(props: TMapProps) {
  const {
    ref,
    provider,
    initialRegion,
    onRegionChangeComplete,
    onMapReady,
    onAppleMapReady,
    onGoogleMapReady,
    style,
    mapStyle,
    enableUserLocation,
    children,
  } = props;

  const [_mapReady, setMapReady] = useState(false);

  function onMapIsReady() {
    setMapReady(true);

    onMapReady?.();
    provider === 'google' ? onGoogleMapReady?.() : onAppleMapReady?.();
  }

  if (!ref) {
    return null;
  }

  return (
    <View style={[styles.wrapper, style]}>
      <MapView
        ref={ref}
        provider={provider}
        showsUserLocation={!!enableUserLocation}
        showsMyLocationButton={false}
        zoomEnabled
        scrollEnabled
        zoomControlEnabled={false}
        mapType="standard"
        initialRegion={initialRegion || defaultMapRegion}
        onMapReady={onMapIsReady}
        onRegionChangeComplete={onRegionChangeComplete}
        style={[styles.map, mapStyle]}
        userInterfaceStyle="light"
      >
        {children}
      </MapView>

      {!!enableUserLocation && <MapLocateMeBtn mapRef={ref} />}
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
