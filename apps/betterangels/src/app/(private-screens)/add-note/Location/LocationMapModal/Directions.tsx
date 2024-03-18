import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, H3 } from '@monorepo/expo/shared/ui-components';
import { Pressable, View } from 'react-native';
import openMap from 'react-native-open-maps';

type locationLongLat = {
  longitude: number;
  latitude: number;
  name: string | undefined;
};

interface IDirectionsProps {
  currentLocation: locationLongLat | undefined;
  address: { full: string; short: string } | undefined;
  setChooseDirections: (e: boolean) => void;
  setSelected: (e: boolean) => void;
}

export default function Directions(props: IDirectionsProps) {
  const { currentLocation, address, setChooseDirections, setSelected } = props;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        zIndex: 1000,
        left: 0,
        width: '100%',
        paddingBottom: Spacings.sm,
        paddingHorizontal: Spacings.sm,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.WHITE,
          marginBottom: Spacings.xs,
          borderRadius: 10,
          shadowColor: Colors.BLACK,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Pressable
          onPress={() =>
            openMap({
              latitude: currentLocation?.latitude,
              longitude: currentLocation?.longitude,
              query: address?.full,
              provider: 'apple',
            })
          }
          style={{
            padding: Spacings.sm,
            alignItems: 'center',
            borderBottomWidth: 0.5,
            borderBottomColor: Colors.NEUTRAL_LIGHT,
          }}
          accessibilityRole="button"
          accessibilityHint="opens apple maps"
        >
          <BodyText color={Colors.PRIMARY}>Apple Maps</BodyText>
        </Pressable>
        <Pressable
          onPress={() => {
            openMap({
              end: `${currentLocation?.latitude},${currentLocation?.longitude}`,
              query: address?.full,
              provider: 'google',
            });
          }}
          style={{
            padding: Spacings.sm,
            alignItems: 'center',
            borderTopWidth: 0.5,
            borderTopColor: Colors.NEUTRAL_LIGHT,
          }}
          accessibilityRole="button"
          accessibilityHint="opens google maps"
        >
          <BodyText color={Colors.PRIMARY}>Google Maps</BodyText>
        </Pressable>
      </View>
      <Pressable
        style={{
          backgroundColor: Colors.WHITE,
          borderRadius: 20,
          padding: Spacings.sm,
          alignItems: 'center',
          shadowColor: Colors.BLACK,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        accessibilityRole="button"
        accessibilityHint="close map selection"
        onPress={() => {
          setChooseDirections(false);
          setSelected(true);
        }}
      >
        <H3 color={Colors.PRIMARY}>Cancel</H3>
      </Pressable>
    </View>
  );
}
