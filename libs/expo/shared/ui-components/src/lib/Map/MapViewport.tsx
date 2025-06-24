import { ReactNode, RefObject, useCallback } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import MapView, { Details, Region } from 'react-native-maps';
import { defaultMapRegion } from './constants';
import { MapLocateMeBtn } from './mapUi/MapLocateMeBtn';
import { TMapDims, TMapView } from './types';

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
  onMeasured?: (dims: TMapDims) => void;
};

export function MapViewport(props: TMapProps) {
  const {
    ref,
    provider,
    initialRegion,
    onRegionChangeComplete,
    onMapReady,
    onMeasured,
    style,
    mapStyle,
    enableUserLocation,
    children,
  } = props;
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;

    onMeasured?.({
      width: Math.round(width * 100) / 100,
      height: Math.round(height * 100) / 100,
    });
  }, []);

  function onMapIsReady() {
    onMapReady?.();
  }

  if (!ref) {
    return null;
  }

  return (
    <View style={[styles.wrapper, style]}>
      <MapView
        ref={ref}
        onLayout={handleLayout}
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
