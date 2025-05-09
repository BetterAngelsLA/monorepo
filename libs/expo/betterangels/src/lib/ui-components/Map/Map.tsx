import { StyleSheet } from 'react-native';
import { MapView, PROVIDER_GOOGLE } from '../../maps';
import { LA_COUNTY_CENTER } from '../../services';

type TProps = {};

export function BaMap(props?: TProps) {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        longitudeDelta: 0.05,
        latitudeDelta: 0.05,
        latitude: LA_COUNTY_CENTER.lat,
        longitude: LA_COUNTY_CENTER.lng,
      }}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 450,
  },
});
