import { MapView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';

export function Locations() {
  return <MapView style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    height: 650,
  },
});
