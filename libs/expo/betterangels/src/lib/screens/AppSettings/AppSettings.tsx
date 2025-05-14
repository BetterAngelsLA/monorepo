import { InfoIcon, MapPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { LA_COUNTY_CENTER } from '../../services';
import { MainContainer, NavButton } from '../../ui-components';

export function AppSettings() {
  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.pageCard}>
        <NavButton title="About" Icon={InfoIcon} route="settings/about" />
      </View>

      {/* TODO: DELTE AFTER DEMO   */}
      <DemoMap />
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  pageCard: {
    display: 'flex',
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
  },
});

// TODO: DELTE AFTER DEMO

export const defaultRegion: Region = {
  longitudeDelta: 0.12,
  latitudeDelta: 0.12,
  latitude: LA_COUNTY_CENTER.lat,
  longitude: LA_COUNTY_CENTER.lng,
};

const locations = [
  { name: 'A', latitude: 34.0905, longitude: -118.2878, size: 'S' },
  { name: 'A 2', latitude: 34.0905, longitude: -118.2478, size: 'M' },
  { name: 'A 3', latitude: 34.0825, longitude: -118.2078, size: 'L' },

  { name: 'B', latitude: 34.0505, longitude: -118.2878, size: 'S' },
  { name: 'B 2', latitude: 34.0505, longitude: -118.2478, size: 'M' },
  { name: 'B 3', latitude: 34.0425, longitude: -118.2078, size: 'L' },

  { name: 'C', latitude: 34.0005, longitude: -118.2878, size: 'S' },
  { name: 'C 2', latitude: 34.0005, longitude: -118.2478, size: 'M' },
  { name: 'C 3', latitude: 34.0005, longitude: -118.2078, size: 'L' },
];

function DemoMap() {
  return (
    <View style={{ marginTop: 16 }}>
      <MapView
        provider="google"
        initialRegion={defaultRegion}
        style={{
          width: '100%',
          height: 600,
        }}
      >
        {locations.map((loc, idx) => {
          return (
            <Marker
              key={`${loc.latitude}-${idx}`}
              title={loc.name}
              coordinate={{
                latitude: loc.latitude,
                longitude: loc.longitude,
              }}
            >
              <MapPinIcon size={(loc.size || 'M') as any} />
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}
