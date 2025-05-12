import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MapView from 'react-native-map-clustering';
import { Marker } from 'react-native-maps';
import { defaultRegion } from '../../ui-components/Map/contants';
import { laLocations } from '../../ui-components/Map/locations';

export default function ClusterB() {
  const mapRef = useRef<MapView>(null);

  return (
    <ScrollView>
      <View>
        <TextRegular>ClusterB</TextRegular>
        <MapView
          ref={mapRef}
          initialRegion={defaultRegion}
          style={styles.map}
          clusterColor="purple"
          radius={40}
          maxZoom={20}
        >
          {laLocations.map((loc, idx) => {
            return (
              <Marker
                key={`${loc.latitude}-${idx}`}
                coordinate={{
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }}
              />
            );
          })}
        </MapView>
        {/* <Button onPress={animateToRegion} title="Animate" /> */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 350,
  },
});
