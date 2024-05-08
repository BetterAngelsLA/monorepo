import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ViewNoteQuery } from '../../apollo';

export default function NoteLocation({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View>
      <TextBold mb="xs" size="sm">
        Location
      </TextBold>
      <MapView
        zoomEnabled={false}
        scrollEnabled={false}
        provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
        region={{
          longitudeDelta: 0.005,
          latitudeDelta: 0.005,
          latitude: note?.point[1],
          longitude: note?.point[0],
        }}
        style={styles.map}
      >
        <Marker
          coordinate={{
            latitude: note?.point[1],
            longitude: note?.point[0],
          }}
        >
          <LocationPinIcon size="2xl" />
        </Marker>
      </MapView>
      <TextRegular mt="xs">{note?.address?.street}</TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 97,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
});
