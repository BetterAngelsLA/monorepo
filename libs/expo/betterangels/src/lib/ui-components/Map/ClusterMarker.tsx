import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

type Props = {
  coordinate: { latitude: number; longitude: number };
  count: number;
  onPress?: () => void;
};

export function ClusterMarker({ coordinate, count, onPress }: Props) {
  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={styles.cluster}>
        <Text style={styles.count}>{count}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  cluster: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  count: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
