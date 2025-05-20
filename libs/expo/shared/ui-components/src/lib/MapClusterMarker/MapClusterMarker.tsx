import { StyleSheet, View } from 'react-native';

export type TMapClusterMarkerSize = 'S' | 'M' | 'L';
export type TMapClusterMarkerVariant = 'primary';

interface IMapClusterMarkerProps {
  color?: string;
  size?: TMapClusterMarkerSize;
  variant?: TMapClusterMarkerVariant;
  text?: string;
  subscriptAfter?: string;
}

export function MapClusterMarker(props: IMapClusterMarkerProps) {
  const { color, size, variant, text, subscriptAfter } = props;

  return <View style={styles.container}>{text}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
  },
});
