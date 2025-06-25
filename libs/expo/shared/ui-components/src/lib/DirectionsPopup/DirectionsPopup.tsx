import { Colors, Spacings } from '@monorepo/expo/shared/static';

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import openMap from 'react-native-open-maps';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

interface IDirectionsPopupProps {
  address:
    | {
        street?: string | undefined | null;
        city?: string | undefined | null;
        state?: string | undefined | null;
        zipCode?: string | undefined | null;
      }
    | undefined;
  onCancel: () => void;
}

export function DirectionsPopup(props: IDirectionsPopupProps) {
  const { address, onCancel } = props;

  const getFullAddress = () => {
    if (!address?.street) return '';
    const { street, city, state, zipCode } = address;
    return `${street}, ${city}, ${state} ${zipCode}`;
  };

  return (
    <Modal
      visible={!!address}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onCancel}
          style={{ ...StyleSheet.absoluteFillObject }}
          accessibilityRole="button"
          accessibilityHint="Closes the map selection"
        />
        <View
          style={{
            paddingBottom: Spacings.sm,
            paddingHorizontal: Spacings.sm,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.WHITE,
              marginBottom: Spacings.xs,
              borderRadius: 8,
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
                  query: getFullAddress(),
                  provider: 'apple',
                  travelType: 'drive',
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
              <TextRegular color={Colors.PRIMARY}>Apple Maps</TextRegular>
            </Pressable>
            <Pressable
              onPress={() => {
                openMap({
                  query: getFullAddress(),
                  provider: 'google',
                  travelType: 'drive',
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
              <TextRegular color={Colors.PRIMARY}>Google Maps</TextRegular>
            </Pressable>
          </View>
          <Pressable
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 8,
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
            onPress={onCancel}
          >
            <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
