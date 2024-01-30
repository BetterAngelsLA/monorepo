import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, H5, Input } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface ILocationProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
}

type locationLongLat = {
  longitude: number;
  latitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function Location(props: ILocationProps) {
  const { expanded, setExpanded } = props;
  const { control, watch } = useFormContext();
  const [currentLocation, setCurrentLocation] = useState<locationLongLat>({
    longitude: -118.258815,
    latitude: 34.048655,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
  });

  const location = watch('location');
  const isLocation = expanded === 'Location';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isLocation ? undefined : 'Location')}
      title="Location"
      actionName={
        !location && !isLocation ? <H5 size="sm">Add Location</H5> : null
      }
    >
      <View style={{ paddingBottom: Spacings.md }}>
        {isLocation && <Input mb="sm" name="location" control={control} />}
        <MapView
          zoomEnabled={isLocation}
          scrollEnabled={isLocation}
          onPress={(e) =>
            isLocation &&
            setCurrentLocation({
              ...currentLocation,
              longitude: e.nativeEvent.coordinate.longitude,
              latitude: e.nativeEvent.coordinate.latitude,
            })
          }
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: currentLocation.latitudeDelta,
            longitudeDelta: currentLocation.longitudeDelta,
          }}
          style={styles.map}
        >
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
          />
        </MapView>
      </View>
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 97,
  },
});
