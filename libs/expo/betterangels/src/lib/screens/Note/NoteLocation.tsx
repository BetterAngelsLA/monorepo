import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import {
  DirectionsPopup,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../maps';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NoteLocation({
  note,
}: {
  note: NoteSummaryQuery['note'] | undefined;
}) {
  const [chooseDirections, setChooseDirections] = useState(false);

  return (
    <View>
      <TextBold mb="xs" size="sm">
        Location
      </TextBold>
      <MapView
        zoomEnabled={false}
        scrollEnabled={false}
        provider={PROVIDER_GOOGLE}
        region={{
          longitudeDelta: 0.005,
          latitudeDelta: 0.005,
          latitude: note?.location?.point[1],
          longitude: note?.location?.point[0],
        }}
        style={styles.map}
      >
        <Marker
          coordinate={{
            latitude: note?.location?.point[1],
            longitude: note?.location?.point[0],
          }}
        >
          <LocationPinIcon size="2xl" />
        </Marker>
      </MapView>
      {note?.location?.address?.street && (
        <TextRegular
          onPress={() => setChooseDirections(true)}
          textDecorationLine="underline"
          mt="xs"
        >
          {note?.location?.address?.street}
        </TextRegular>
      )}

      {chooseDirections && (
        <DirectionsPopup
          address={note?.location?.address}
          onCancel={() => setChooseDirections(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 97,
    borderRadius: Radiuses.xs,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
});
