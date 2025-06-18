import { ReactNode, RefObject, useState } from 'react';
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
  ref: RefObject<TRNMapView | null>;
};

export function MapView(props: TMapProps) {
  const {
    provider,
    initialRegion,
    style,
    mapStyle,
    enableUserLocation,
    children,
    ref,
  } = props;

  const [_mapReady, setMapReady] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <RNMapView
        ref={ref}
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
      </RNMapView>

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
