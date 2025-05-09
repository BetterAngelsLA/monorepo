import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { StyleSheet } from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../maps';
import { LA_COUNTY_CENTER } from '../../services';
import { laLocations } from './locations';

type TProps = {};

export function BaMap(props?: TProps) {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      zoomEnabled
      scrollEnabled
      zoomControlEnabled
      mapType="standard"
      style={styles.map}
      initialRegion={{
        longitudeDelta: 0.1,
        latitudeDelta: 0.1,
        latitude: LA_COUNTY_CENTER.lat,
        longitude: LA_COUNTY_CENTER.lng,
      }}
    >
      {laLocations.map((marker, idx) => (
        <Marker key={idx} coordinate={marker} zIndex={99}>
          <LocationPinIcon size="lg" />
        </Marker>
      ))}
      {/* <Marker
        coordinate={{
          latitude: LA_COUNTY_CENTER.lat,
          longitude: LA_COUNTY_CENTER?.lng,
        }}
      >
        <LocationPinIcon size="2xl" />
      </Marker> */}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 450,
  },
});
